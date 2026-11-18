import { useEffect, useRef } from "react";
import { markMessageAsRead } from "@/lib/queries/chat/chatActions";
import { Message } from "@/types/evolution.types";

interface UseChatReadReceiptsProps {
  instanceName?: string;
  instanceToken?: string;
  remoteJid?: string;
  messages: Message[];
}

export function useChatReadReceipts({
  instanceName,
  instanceToken,
  remoteJid,
  messages,
}: UseChatReadReceiptsProps) {
  const markedMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!instanceName || !remoteJid || messages.length === 0) return;

    // Format destination JID to ensure compatibility with Baileys isPnUser / isJidGroup
    const cleanJid = remoteJid.includes("@")
      ? remoteJid.endsWith("@lid")
        ? remoteJid.split("@")[0] + "@s.whatsapp.net"
        : remoteJid
      : `${remoteJid}@s.whatsapp.net`;

    // Filter incoming unread messages that haven't been marked yet
    const unreadKeys = messages
      .filter((m) => {
        if (m.key?.fromMe) return false;
        const id = m.key?.id || m.id;
        if (!id) return false;
        if (markedMessageIdsRef.current.has(id)) return false;
        return true;
      })
      .map((m) => ({
        id: m.key?.id || m.id,
        fromMe: false,
        remoteJid: cleanJid,
      }));

    if (unreadKeys.length > 0) {
      unreadKeys.forEach((k) => markedMessageIdsRef.current.add(k.id));

      markMessageAsRead({
        instanceName,
        token: instanceToken,
        readMessages: unreadKeys,
      });
    }
  }, [instanceName, instanceToken, remoteJid, messages]);

  // Reset tracking when switching active chat
  useEffect(() => {
    markedMessageIdsRef.current.clear();
  }, [remoteJid]);
}
