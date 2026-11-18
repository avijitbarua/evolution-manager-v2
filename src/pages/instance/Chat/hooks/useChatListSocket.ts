import { Dispatch, SetStateAction, useEffect } from "react";
import { getToken, TOKEN_ID } from "@/lib/queries/token";
import { connectSocket, disconnectSocket } from "@/services/websocket/socket";
import { Chat, Message } from "@/types/evolution.types";
import { formatJid, sortChatsByLatest } from "../utils/chatListUtils";

interface UseChatListSocketProps {
  instanceName?: string;
  currentRemoteJid?: string;
  setRealtimeChats: Dispatch<SetStateAction<Chat[]>>;
}

export function useChatListSocket({
  instanceName,
  currentRemoteJid,
  setRealtimeChats,
}: UseChatListSocketProps) {
  useEffect(() => {
    if (!instanceName) return;
    const serverUrl = getToken(TOKEN_ID.API_URL);
    if (!serverUrl) return;

    const socket = connectSocket(serverUrl);

    // Handle new incoming or outgoing message
    const handleNewMessage = (data: any) => {
      if (data.instance !== instanceName) return;
      const msg: Message = data?.data;
      if (!msg?.key) return;

      const jid = msg.key.remoteJid;
      const altJid = (msg.key as any).remoteJidAlt;
      if (!jid) return;

      setRealtimeChats((prev) => {
        const cleanJid = jid.split("@")[0];
        const idx = prev.findIndex(
          (c) =>
            c.remoteJid === jid ||
            (altJid && c.remoteJid === altJid) ||
            c.remoteJid.split("@")[0] === cleanJid,
        );

        const isCurrentChat =
          currentRemoteJid &&
          (currentRemoteJid === jid ||
            currentRemoteJid === altJid ||
            currentRemoteJid.split("@")[0] === cleanJid);

        let updatedChat: Chat;

        if (idx !== -1) {
          const existing = prev[idx];
          const unreadIncrement = !msg.key.fromMe && !isCurrentChat ? 1 : 0;
          updatedChat = {
            ...existing,
            pushName: msg.pushName || existing.pushName,
            updatedAt: new Date().toISOString(),
            lastMessage: msg,
            unreadCount: isCurrentChat ? 0 : (existing.unreadCount || 0) + unreadIncrement,
          };
          const next = [...prev];
          next[idx] = updatedChat;
          return sortChatsByLatest(next);
        } else {
          // New chat received from socket that wasn't in DB list yet
          updatedChat = {
            id: jid,
            remoteJid: jid,
            pushName: msg.pushName || formatJid(jid),
            profilePicUrl: (msg.key as any).profilePictureUrl || "",
            updatedAt: new Date().toISOString(),
            lastMessage: msg,
            unreadCount: !msg.key.fromMe && !isCurrentChat ? 1 : 0,
            labels: null,
          };
          return sortChatsByLatest([updatedChat, ...prev]);
        }
      });
    };

    // Handle message status updates (e.g. read receipts or delivery updates on last message)
    const handleMessageUpdate = (data: any) => {
      if (data.instance !== instanceName) return;
      const updateData = data?.data;
      if (!updateData) return;

      const items = Array.isArray(updateData) ? updateData : [updateData];

      setRealtimeChats((prev) => {
        let hasChanged = false;
        const next = prev.map((chat) => {
          if (!chat.lastMessage) return chat;
          const lastMsgId = chat.lastMessage.key?.id || chat.lastMessage.id;

          for (const item of items) {
            const targetId = item.keyId || item.key?.id || item.id;
            const newStatus = item.status ?? item.update?.status;

            if (targetId && lastMsgId === targetId && newStatus !== undefined) {
              hasChanged = true;
              return {
                ...chat,
                lastMessage: {
                  ...chat.lastMessage,
                  status: newStatus,
                },
              };
            }
          }
          return chat;
        });

        return hasChanged ? next : prev;
      });
    };

    socket.on("messages.upsert", handleNewMessage);
    socket.on("send.message", handleNewMessage);
    socket.on("messages.update", handleMessageUpdate);
    socket.on("send.message.update", handleMessageUpdate);
    socket.connect();

    return () => {
      socket.off("messages.upsert");
      socket.off("send.message");
      socket.off("messages.update");
      socket.off("send.message.update");
      disconnectSocket(socket);
    };
  }, [instanceName, currentRemoteJid]);
}
