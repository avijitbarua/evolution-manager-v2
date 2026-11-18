import { useEffect, Dispatch, SetStateAction } from "react";
import { getToken, TOKEN_ID } from "@/lib/queries/token";
import { connectSocket, disconnectSocket } from "@/services/websocket/socket";
import { Message } from "@/types/evolution.types";

interface UseChatSocketProps {
  instanceName?: string;
  remoteJid?: string;
  setRealtimeMessages: Dispatch<SetStateAction<Message[]>>;
}

export function useChatSocket({
  instanceName,
  remoteJid,
  setRealtimeMessages,
}: UseChatSocketProps) {
  useEffect(() => {
    if (!instanceName || !remoteJid) return;

    const serverUrl = getToken(TOKEN_ID.API_URL);
    if (!serverUrl) return;

    const socket = connectSocket(serverUrl);

    const handleIncomingMessage = (data: any) => {
      if (data.instance !== instanceName) return;

      const incomingMsg = data?.data;
      if (!incomingMsg?.key) return;

      // Handle Reaction Message
      if (incomingMsg.message?.reactionMessage) {
        const targetKey = incomingMsg.message.reactionMessage.key;
        const emoji = incomingMsg.message.reactionMessage.text;

        setRealtimeMessages((prev) =>
          prev.map((msg) => {
            if (msg.key?.id === targetKey.id) {
              const currentReactions = (msg as any).reactions || [];
              const sender = incomingMsg.pushName || (incomingMsg.key.fromMe ? "Você" : "Contato");
              const filtered = currentReactions.filter(
                (r: any) => !(r.sender === sender || (incomingMsg.key.fromMe && r.fromMe)),
              );

              const nextReactions = emoji
                ? [...filtered, { text: emoji, sender, fromMe: incomingMsg.key.fromMe }]
                : filtered;

              return { ...msg, reactions: nextReactions };
            }
            return msg;
          }),
        );
        return;
      }

      // Handle Protocol Message (Revoke / Delete for Everyone)
      if (incomingMsg.message?.protocolMessage?.type === 0) {
        const revokedKey = incomingMsg.message.protocolMessage.key;
        setRealtimeMessages((prev) =>
          prev.map((msg) => {
            if (msg.key?.id === revokedKey.id) {
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

      // Ensure message matches current chat
      if (
        incomingMsg.key.remoteJid !== remoteJid &&
        incomingMsg.key.remoteJidAlt !== remoteJid
      ) {
        return;
      }

      setRealtimeMessages((prev) => {
        const existingIndex = prev.findIndex((m) => m.key?.id === incomingMsg.key?.id);
        if (existingIndex !== -1) {
          const next = [...prev];
          next[existingIndex] = { ...next[existingIndex], ...incomingMsg };
          return next;
        }
        return [...prev, incomingMsg];
      });
    };

    // Handle Status Updates (Sent, Delivered, Seen / Read)
    const handleMessageStatus = (data: any) => {
      if (data.instance !== instanceName) return;
      const updateData = data?.data;

      const applyStatusUpdate = (keyId: string, statusVal: any) => {
        setRealtimeMessages((prev) =>
          prev.map((msg) =>
            msg.key?.id === keyId ? { ...msg, status: statusVal } : msg,
          ),
        );
      };

      if (Array.isArray(updateData)) {
        updateData.forEach((item) => {
          if (item?.key?.id && (item?.update?.status !== undefined || item?.status !== undefined)) {
            applyStatusUpdate(item.key.id, item.update?.status ?? item.status);
          }
        });
      } else if (updateData?.key?.id && (updateData?.status !== undefined || updateData?.update?.status !== undefined)) {
        applyStatusUpdate(updateData.key.id, updateData.update?.status ?? updateData.status);
      }
    };

    socket.on("messages.upsert", handleIncomingMessage);
    socket.on("send.message", handleIncomingMessage);
    socket.on("messages.update", handleMessageStatus);

    socket.connect();

    return () => {
      socket.off("messages.upsert");
      socket.off("send.message");
      socket.off("messages.update");
      disconnectSocket(socket);
    };
  }, [instanceName, remoteJid, setRealtimeMessages]);
}
