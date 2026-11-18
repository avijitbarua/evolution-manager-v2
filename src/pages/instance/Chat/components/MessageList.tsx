import { RefObject, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare } from "lucide-react";
import { Message } from "@/types/evolution.types";
import { formatDateSeparator, getMessageTimestamp } from "../utils/messageStatus";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  remoteJid: string;
  isLoading?: boolean;
  lastMessageRef: RefObject<HTMLDivElement>;
  onReact: (message: Message, emoji: string) => void;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
}

const DateSeparator = ({ date }: { date: string }) => (
  <div className="flex items-center justify-center py-3">
    <div className="rounded-full bg-muted/60 px-3 py-1 shadow-xs backdrop-blur-xs">
      <span className="text-xs font-medium text-muted-foreground">{date}</span>
    </div>
  </div>
);

export function MessageList({
  messages,
  remoteJid,
  isLoading,
  lastMessageRef,
  onReact,
  onReply,
  onEdit,
  onDelete,
}: MessageListProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  // Group messages by date
  const groupedMessages = useMemo(() => {
    if (!messages || messages.length === 0) return [];

    // Deduplicate by message key.id / id to ensure strict uniqueness
    const seenIds = new Set<string>();
    const deduplicated: Message[] = [];
    messages.forEach((m) => {
      const id = m.key?.id || m.id;
      if (id) {
        if (!seenIds.has(id)) {
          seenIds.add(id);
          deduplicated.push(m);
        }
      } else {
        deduplicated.push(m);
      }
    });

    const sortedMessages = deduplicated.sort((a, b) => {
      const aTime = getMessageTimestamp(a).getTime();
      const bTime = getMessageTimestamp(b).getTime();
      return aTime - bTime;
    });

    const grouped: { date: string; messages: Message[] }[] = [];
    let currentDate = "";
    let currentGroup: Message[] = [];

    sortedMessages.forEach((message) => {
      const messageDate = getMessageTimestamp(message);
      const dateString = messageDate.toDateString();

      if (dateString !== currentDate) {
        if (currentGroup.length > 0) {
          grouped.push({
            date: formatDateSeparator(new Date(currentDate), t, locale),
            messages: currentGroup,
          });
        }
        currentDate = dateString;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      grouped.push({
        date: formatDateSeparator(new Date(currentDate), t, locale),
        messages: currentGroup,
      });
    }

    return grouped;
  }, [messages, t, locale]);

  const scrollToMessage = (stanzaId?: string) => {
    if (!stanzaId) return;
    const el = document.getElementById(`msg-${stanzaId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-primary/20");
      setTimeout(() => el.classList.remove("bg-primary/20"), 1200);
    }
  };

  if (isLoading && (!messages || messages.length === 0)) {
    return (
      <div className="flex w-full flex-1 flex-col justify-end space-y-4 overflow-y-auto px-4 py-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted/60 self-start" />
        <div className="h-14 w-64 animate-pulse rounded-lg bg-primary/20 self-end" />
        <div className="h-10 w-52 animate-pulse rounded-lg bg-muted/60 self-start" />
        <div className="h-12 w-40 animate-pulse rounded-lg bg-primary/20 self-end" />
      </div>
    );
  }

  if (!isLoading && (!messages || messages.length === 0)) {
    return (
      <div className="flex w-full flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
          <MessageSquare className="h-6 w-6 text-muted-foreground/70" />
        </div>
        <p className="text-sm font-medium">
          {t("chat.empty.noMessages", { defaultValue: "No messages in this conversation" })}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/80">
          {t("chat.empty.startConversation", { defaultValue: "Send a message to start chatting." })}
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col overflow-y-auto px-4 py-4">
      {groupedMessages.map((group, groupIndex) => (
        <div key={`group-${groupIndex}-${group.date}`}>
          <DateSeparator date={group.date} />
          {group.messages.map((message, msgIdx) => {
            const uniqueKey = message.id
              ? `${message.id}-${msgIdx}`
              : `${message.key?.id || "msg"}-${message.key?.fromMe ? "out" : "in"}-${message.messageTimestamp || msgIdx}-${msgIdx}`;
            return (
              <MessageBubble
                key={uniqueKey}
                message={message}
                remoteJid={remoteJid}
                onReact={onReact}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onQuoteClick={scrollToMessage}
              />
            );
          })}
        </div>
      ))}
      <div ref={lastMessageRef as never} />
    </div>
  );
}
