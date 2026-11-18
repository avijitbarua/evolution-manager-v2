import { useState, useRef, useEffect, useCallback } from "react";
import { sendPresence } from "@/lib/queries/chat/chatActions";
import { getToken, TOKEN_ID } from "@/lib/queries/token";
import { connectSocket, disconnectSocket } from "@/services/websocket/socket";

interface UseChatPresenceProps {
  instanceName?: string;
  instanceToken?: string;
  remoteJid?: string;
}

export function useChatPresence({
  instanceName,
  instanceToken,
  remoteJid,
}: UseChatPresenceProps) {
  const [contactPresence, setContactPresence] = useState<"composing" | "recording" | null>(null);
  const presenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPresenceSentRef = useRef<number>(0);

  // Send typing presence to backend
  const notifyTyping = useCallback(
    (text: string) => {
      if (!instanceName || !remoteJid) return;

      if (text.trim().length > 0) {
        const now = Date.now();
        if (now - lastPresenceSentRef.current > 3000) {
          lastPresenceSentRef.current = now;
          sendPresence({
            instanceName,
            token: instanceToken,
            number: remoteJid,
            presence: "composing",
            delay: 1500,
          });
        }
      }
    },
    [instanceName, instanceToken, remoteJid],
  );

  const notifyPaused = useCallback(() => {
    if (!instanceName || !remoteJid) return;
    sendPresence({
      instanceName,
      token: instanceToken,
      number: remoteJid,
      presence: "paused",
    });
  }, [instanceName, instanceToken, remoteJid]);

  // Listen to remote typing presence over WebSocket
  useEffect(() => {
    if (!instanceName || !remoteJid) return;

    const serverUrl = getToken(TOKEN_ID.API_URL);
    if (!serverUrl) return;

    const socket = connectSocket(serverUrl);

    const handlePresence = (data: any) => {
      if (data.instance !== instanceName) return;

      const jid = data?.data?.id;
      if (
        jid !== remoteJid &&
        data?.data?.key?.remoteJid !== remoteJid &&
        data?.data?.key?.remoteJidAlt !== remoteJid
      ) {
        return;
      }

      const presences = data?.data?.presences;
      let status: string | null = null;

      if (presences && typeof presences === "object") {
        const firstKey = Object.keys(presences)[0];
        status = presences[firstKey]?.lastKnownPresence;
      } else if (data?.data?.presence) {
        status = data?.data?.presence;
      }

      if (status === "composing" || status === "recording") {
        setContactPresence(status);
        if (presenceTimeoutRef.current) clearTimeout(presenceTimeoutRef.current);
        presenceTimeoutRef.current = setTimeout(() => {
          setContactPresence(null);
        }, 4500);
      } else if (
        status === "paused" ||
        status === "available" ||
        status === "unavailable"
      ) {
        setContactPresence(null);
      }
    };

    socket.on("presence.update", handlePresence);
    socket.connect();

    return () => {
      socket.off("presence.update");
      if (presenceTimeoutRef.current) clearTimeout(presenceTimeoutRef.current);
      disconnectSocket(socket);
    };
  }, [instanceName, remoteJid]);

  return {
    contactPresence,
    notifyTyping,
    notifyPaused,
  };
}
