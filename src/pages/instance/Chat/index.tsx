import "./style.css";
import { Button } from "@evoapi/design-system/button";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { useInstance } from "@/contexts/InstanceContext";
import { useFindChats } from "@/lib/queries/chat/findChats";
import { cn } from "@/lib/utils";
import { Chat as ChatType } from "@/types/evolution.types";
import { useMediaQuery } from "@/utils/useMediaQuery";

import { ChatSidebar } from "./components/sidebar/ChatSidebar";
import { useChatListSocket } from "./hooks/useChatListSocket";
import { Messages } from "./messages";
import { sortChatsByLatest } from "./utils/chatListUtils";

function Chat() {
  const { t } = useTranslation();
  const isMD = useMediaQuery("(min-width: 768px)");
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const [textareaHeight] = useState("auto");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { instance } = useInstance();

  const [realtimeChats, setRealtimeChats] = useState<ChatType[]>([]);

  const { data: chats } = useFindChats({ instanceName: instance?.name });

  const { instanceId, remoteJid } = useParams<{ instanceId: string; remoteJid: string }>();
  const navigate = useNavigate();

  // Socket listener for real-time messages & instant chat list reordering
  useChatListSocket({
    instanceName: instance?.name,
    currentRemoteJid: remoteJid,
    setRealtimeChats,
  });

  // Merge server chats with realtime updates and sort by latest activity
  const allChats = useMemo(() => {
    const map = new Map<string, ChatType>();

    if (chats && Array.isArray(chats)) {
      chats.forEach((c) => map.set(c.remoteJid, c));
    }

    realtimeChats.forEach((c) => {
      const existing = map.get(c.remoteJid);
      map.set(c.remoteJid, existing ? { ...existing, ...c } : c);
    });

    return sortChatsByLatest(Array.from(map.values()));
  }, [chats, realtimeChats]);

  const scrollToBottom = useCallback(() => {
    lastMessageRef.current?.scrollIntoView({});
  }, []);

  const handleTextareaChange = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    const scrollHeight = textareaRef.current.scrollHeight;
    const lineHeight = parseInt(getComputedStyle(textareaRef.current).lineHeight);
    const maxHeight = lineHeight * 10;
    textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
  };

  const handleChat = (jid: string) => {
    // Clear unread count optimistically when opening the chat
    setRealtimeChats((prev) =>
      prev.map((c) => (c.remoteJid === jid ? { ...c, unreadCount: 0 } : c)),
    );
    navigate(`/manager/instance/${instanceId}/chat/${jid}`);
  };

  const handleBack = () => navigate(`/manager/instance/${instanceId}/chat`);

  const showSidebar = !remoteJid || isMD;
  const showChat = !!remoteJid;

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background shadow-xs">
      {/* WhatsApp Web Left Sidebar */}
      <div className={cn("h-full", showSidebar ? "flex w-full md:w-auto" : "hidden md:flex")}>
        <ChatSidebar
          chats={allChats}
          instanceName={instance?.name}
          instanceToken={instance?.token}
          selectedRemoteJid={remoteJid}
          onSelectChat={handleChat}
        />
      </div>

      {/* WhatsApp Web Conversation Screen */}
      <main
        className={cn(
          "flex h-full min-h-0 flex-1 flex-col overflow-hidden",
          showChat ? "flex" : "hidden md:flex",
        )}
      >
        {remoteJid ? (
          <>
            {!isMD && (
              <div className="flex items-center border-b bg-background/95 p-2 backdrop-blur-sm">
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  {t("chat.back", { defaultValue: "Voltar" })}
                </Button>
              </div>
            )}
            <Messages
              textareaRef={textareaRef}
              handleTextareaChange={handleTextareaChange}
              textareaHeight={textareaHeight}
              lastMessageRef={lastMessageRef}
              scrollToBottom={scrollToBottom}
            />
          </>
        ) : (
          <div className="flex h-full flex-1 items-center justify-center p-8 bg-muted/5">
            <div className="text-center max-w-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/60">
                <MessageCircle className="h-8 w-8 text-muted-foreground/70" />
              </div>
              <h3 className="mb-1 text-lg font-semibold text-foreground">
                {t("chat.empty.selectTitle", { defaultValue: "Select a conversation" })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("chat.empty.selectDescription", {
                  defaultValue: "Choose a contact or group from the list to start chatting.",
                })}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export { Chat };
