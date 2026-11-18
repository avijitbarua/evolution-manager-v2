import { useTranslation } from "react-i18next";
import { Message } from "@/types/evolution.types";
import { isMessageEdited } from "../utils/messageRules";
import {
  formatMessageTime,
  getMessageTimestamp,
  getSenderColor,
} from "../utils/messageStatus";
import { MessageActionBar } from "./MessageActionBar";
import { MessageContent } from "./MessageContent";
import { MessageStatus } from "./MessageStatus";
import { getQuotedInfo, QuotedBubble } from "./QuotedBubble";

interface MessageBubbleProps {
  message: Message;
  remoteJid: string;
  onReact: (message: Message, emoji: string) => void;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
  onQuoteClick?: (stanzaId?: string) => void;
}

export function MessageBubble({
  message,
  remoteJid,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onQuoteClick,
}: MessageBubbleProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const isFromMe = !!message.key?.fromMe;
  const isGroup = remoteJid.endsWith("@g.us");
  const participant = message.key?.participant;
  const senderKey = participant || message.pushName || "";
  const senderName = message.pushName || (participant ? participant.split("@")[0] : "");
  const quoted = getQuotedInfo(message);
  const reactions = (message as any).reactions || [];
  const edited = isMessageEdited(message);

  return (
    <div
      id={`msg-${message.key?.id || message.id}`}
      className={`group relative mb-4 flex transition-colors duration-300 ${
        isFromMe ? "justify-end" : "justify-start"
      }`}
    >
      {/* Floating Action Bar on Hover */}
      <MessageActionBar
        message={message}
        isFromMe={isFromMe}
        onReact={onReact}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {/* Bubble Container */}
      <div className="relative max-w-[75%] sm:max-w-[70%]">
        {/* Sender Name in Group Chats */}
        {!isFromMe && isGroup && senderName && (
          <div
            className="mb-1 text-xs font-semibold"
            style={{ color: getSenderColor(senderKey) }}
          >
            {senderName}
          </div>
        )}

        {/* Bubble Surface */}
        <div
          className={`rounded-lg px-3 py-2 text-sm shadow-xs ${
            isFromMe
              ? "bg-primary text-primary-foreground"
              : "border border-border/60 bg-muted text-foreground"
          }`}
        >
          {/* Quoted Message preview */}
          <QuotedBubble quoted={quoted} isFromMe={isFromMe} onQuoteClick={onQuoteClick} />

          {/* Content Payload */}
          <MessageContent message={message} />
        </div>

        {/* Reaction Badges on Bubble */}
        {reactions.length > 0 && (
          <div
            className={`absolute -bottom-2 flex cursor-pointer items-center gap-1 rounded-full border border-border/70 bg-background px-1.5 py-0.5 text-xs shadow-xs ${
              isFromMe ? "right-2" : "left-2"
            }`}
          >
            {reactions.map((r: any, idx: number) => (
              <span key={idx} title={r.sender}>
                {r.text}
              </span>
            ))}
          </div>
        )}

        {/* Footer: Edited Label + Timestamp + Status Checks */}
        <div
          className={`mt-0.5 flex items-center gap-1 px-1 text-[11px] text-muted-foreground ${
            isFromMe ? "justify-end" : "justify-start"
          }`}
        >
          {edited && (
            <span className="text-[10px] italic">
              ({t("chat.edited", { defaultValue: "editada" })})
            </span>
          )}
          <span>{formatMessageTime(getMessageTimestamp(message), locale)}</span>
          {isFromMe && <MessageStatus message={message} />}
        </div>
      </div>
    </div>
  );
}
