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

    // Filter incoming unread messages
    const unreadKeys = messages
      .filter((m) => {
        if (m.key?.fromMe) return false;
        if (!m.key?.id) return false;
        if (markedMessageIdsRef.current.has(m.key.id)) return false;
        return true;
      })
      .map((m) => ({
        id: m.key.id,
        fromMe: false,
        remoteJid: m.key.remoteJid || remoteJid,
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

  // Reset when remoteJid changes
  useEffect(() => {
    markedMessageIdsRef.current.clear();
  }, [remoteJid]);
}
