import { RefObject, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Message } from "@/types/evolution.types";
import { formatDateSeparator, getMessageTimestamp } from "../utils/messageStatus";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  remoteJid: string;
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

    const sortedMessages = [...messages].sort((a, b) => {
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

  return (
    <div className="flex w-full flex-1 flex-col overflow-y-auto px-4 py-4">
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex}>
          <DateSeparator date={group.date} />
          {group.messages.map((message) => (
            <MessageBubble
              key={message.key?.id || message.id}
              message={message}
              remoteJid={remoteJid}
              onReact={onReact}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onQuoteClick={scrollToMessage}
            />
          ))}
        </div>
      ))}
      <div ref={lastMessageRef as never} />
    </div>
  );
}
