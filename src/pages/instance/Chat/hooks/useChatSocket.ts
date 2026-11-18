import { useEffect, Dispatch, SetStateAction } from "react";
import { getToken, TOKEN_ID } from "@/lib/queries/token";
import { connectSocket, disconnectSocket } from "@/services/websocket/socket";
import { Message } from "@/types/evolution.types";
import { getMessageText } from "../utils/messageStatus";

interface UseChatSocketProps {
  instanceName?: string;
  remoteJid?: string;
  setMessageList: Dispatch<SetStateAction<Message[]>>;
}

export function useChatSocket({
  instanceName,
  remoteJid,
  setMessageList,
}: UseChatSocketProps) {
  useEffect(() => {
    if (!instanceName || !remoteJid) return;

    const serverUrl = getToken(TOKEN_ID.API_URL);
    if (!serverUrl) return;

    const socket = connectSocket(serverUrl);

    // Normalize JIDs for comparison (handles @lid and @s.whatsapp.net)
    const matchesChat = (msgKey: any) => {
      if (!msgKey) return false;
      const targetJid = remoteJid;
      const cleanTarget = targetJid.split("@")[0];
      const jid1 = msgKey.remoteJid || "";
      const jid2 = msgKey.remoteJidAlt || "";

      return (
        jid1 === targetJid ||
        jid2 === targetJid ||
        jid1.startsWith(cleanTarget) ||
        jid2.startsWith(cleanTarget)
      );
    };

    const handleIncomingMessage = (data: any) => {
      if (data.instance !== instanceName) return;

      const incomingMsg = data?.data;
      if (!incomingMsg?.key) return;

      // 1. Handle Reaction Message
      if (incomingMsg.message?.reactionMessage) {
        const targetKey = incomingMsg.message.reactionMessage.key;
        const emoji = incomingMsg.message.reactionMessage.text;

        setMessageList((prev) =>
          prev.map((msg) => {
            const msgId = msg.key?.id || msg.id;
            if (msgId === targetKey?.id) {
              const currentReactions = (msg as any).reactions || [];
              const sender = incomingMsg.pushName || (incomingMsg.key?.fromMe ? "Você" : "Contato");
              const filtered = currentReactions.filter(
                (r: any) => !(r.sender === sender || (incomingMsg.key?.fromMe && r.fromMe)),
              );

              const nextReactions = emoji
                ? [...filtered, { text: emoji, sender, fromMe: incomingMsg.key?.fromMe }]
                : filtered;

              return { ...msg, reactions: nextReactions };
            }
            return msg;
          }),
        );
        return;
      }

      // 2. Handle Protocol Message (Revoke / Delete for Everyone)
      if (incomingMsg.message?.protocolMessage?.type === 0) {
        const revokedKey = incomingMsg.message.protocolMessage.key;
        setMessageList((prev) =>
          prev.map((msg) => {
            const msgId = msg.key?.id || msg.id;
            if (msgId === revokedKey?.id) {
              return {
                ...msg,
                isRevoked: true,
                message: { conversation: "Esta mensagem foi apagada" },
              };
            }
            return msg;
          }),
        );
        return;
      }

      // 3. Handle Edited Message protocol message (edit)
      const editedContent =
        incomingMsg.message?.protocolMessage?.editedMessage ||
        incomingMsg.message?.editedMessage?.message?.protocolMessage?.editedMessage;
      if (editedContent) {
        const targetId =
          incomingMsg.message?.protocolMessage?.key?.id ||
          incomingMsg.message?.editedMessage?.message?.protocolMessage?.key?.id;
        const newText = getMessageText(editedContent);
        if (targetId && newText) {
          setMessageList((prev) =>
            prev.map((msg) => {
              const msgId = msg.key?.id || msg.id;
              if (msgId === targetId) {
                return {
                  ...msg,
                  message: { conversation: newText },
                  status: "EDITED",
                  isEdited: true,
                };
              }
              return msg;
            }),
          );
          return;
        }
      }

      // Ensure message belongs to current chat
      if (!matchesChat(incomingMsg.key)) {
        return;
      }

      // 4. Upsert Message into canonical messageList
      setMessageList((prev) => {
        const incomingId = incomingMsg.key?.id || incomingMsg.id;
        if (!incomingId) return prev;

        // If it's an outgoing message sent from this client, match with any optimistic temp message
        if (incomingMsg.key?.fromMe) {
          const incomingText = getMessageText(incomingMsg.message);
          const tempIdx = prev.findIndex(
            (m) =>
              ((m.key?.id && m.key.id.startsWith("temp-")) || (m.id && m.id.startsWith("temp-"))) &&
              (!incomingText || getMessageText(m.message) === incomingText),
          );

          if (tempIdx !== -1) {
            const next = [...prev];
            next[tempIdx] = {
              ...next[tempIdx],
              ...incomingMsg,
              id: incomingMsg.id || incomingId,
              status: incomingMsg.status || 2,
            };
            return next;
          }
        }

        const existingIndex = prev.findIndex(
          (m) => (m.key?.id || m.id) === incomingId,
        );

        if (existingIndex !== -1) {
          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            ...incomingMsg,
            // Preserve higher status if already known
            status: incomingMsg.status || next[existingIndex].status,
            reactions: (incomingMsg as any).reactions || (next[existingIndex] as any).reactions,
          };
          return next;
        }
        return [...prev, incomingMsg];
      });
    };

    // 5. Handle Status Updates (Delivered ✓✓, Seen / Read Blue ✓✓)
    const handleMessageStatus = (data: any) => {
      if (data.instance !== instanceName) return;
      const updateData = data?.data;
      if (!updateData) return;

      const items = Array.isArray(updateData) ? updateData : [updateData];

      setMessageList((prev) => {
        let hasChanges = false;
        const updated = prev.map((msg) => {
          const msgId = msg.key?.id || msg.id;

          for (const item of items) {
            const targetKeyId = item.keyId || item.key?.id || item.id;
            const newStatus = item.status ?? item.update?.status;

            if (targetKeyId && msgId === targetKeyId && newStatus !== undefined) {
              hasChanges = true;
              return {
                ...msg,
                status: newStatus,
              };
            }
          }
          return msg;
        });

        return hasChanges ? updated : prev;
      });
    };

    // 6. Handle Edited Message updates event (send.message.update)
    const handleEditedMessage = (data: any) => {
      if (data.instance !== instanceName) return;
      const editedData = data?.data;
      const targetId = editedData?.key?.id || editedData?.keyId;
      const newText =
        getMessageText(editedData?.message) ||
        getMessageText(editedData?.editedMessage);

      if (targetId && newText) {
        setMessageList((prev) =>
          prev.map((msg) => {
            const msgId = msg.key?.id || msg.id;
            if (msgId === targetId) {
              return {
                ...msg,
                message: { conversation: newText },
                status: "EDITED",
                isEdited: true,
              };
            }
            return msg;
          }),
        );
      }
    };

    socket.on("messages.upsert", handleIncomingMessage);
    socket.on("send.message", handleIncomingMessage);
    socket.on("messages.update", handleMessageStatus);
    socket.on("send.message.update", handleEditedMessage);

    socket.connect();

    return () => {
      socket.off("messages.upsert");
      socket.off("send.message");
      socket.off("messages.update");
      socket.off("send.message.update");
      disconnectSocket(socket);
    };
  }, [instanceName, remoteJid, setMessageList]);
}
