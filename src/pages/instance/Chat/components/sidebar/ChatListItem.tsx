import { Avatar, AvatarFallback, AvatarImage } from "@evoapi/design-system/avatar";
import {
  Camera,
  Check,
  CheckCheck,
  Clock,
  FileText,
  MapPin,
  Mic,
  Phone,
  Trash2,
  User,
  Users,
  Video,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Chat } from "@/types/evolution.types";
import {
  formatChatTime,
  formatJid,
  getChatSnippet,
  getChatTimestamp,
  SnippetType,
} from "../../utils/chatListUtils";
import { getMessageStatus } from "../../utils/messageStatus";

interface ChatListItemProps {
  chat: Chat;
  selected: boolean;
  onClick: () => void;
}

const SnippetIcon = ({ icon }: { icon?: SnippetType["icon"] }) => {
  switch (icon) {
    case "image":
      return <Camera className="mr-1 inline-block h-3.5 w-3.5 shrink-0 opacity-80" />;
    case "mic":
      return <Mic className="mr-1 inline-block h-3.5 w-3.5 shrink-0 text-emerald-500 opacity-90" />;
    case "video":
      return <Video className="mr-1 inline-block h-3.5 w-3.5 shrink-0 opacity-80" />;
    case "document":
      return <FileText className="mr-1 inline-block h-3.5 w-3.5 shrink-0 opacity-80" />;
    case "call":
      return <Phone className="mr-1 inline-block h-3.5 w-3.5 shrink-0 opacity-80" />;
    case "location":
      return <MapPin className="mr-1 inline-block h-3.5 w-3.5 shrink-0 opacity-80" />;
    case "deleted":
      return <Trash2 className="mr-1 inline-block h-3.5 w-3.5 shrink-0 opacity-80" />;
    default:
      return null;
  }
};

const StatusTick = ({ status }: { status: number }) => {
  switch (status) {
    case 1:
      return <Clock className="mr-1 inline-block h-3.5 w-3.5 text-muted-foreground/80" />;
    case 2:
      return <Check className="mr-1 inline-block h-3.5 w-3.5 text-muted-foreground" />;
    case 3:
      return <CheckCheck className="mr-1 inline-block h-3.5 w-3.5 text-muted-foreground" />;
    case 4:
    case 5:
      return <CheckCheck className="mr-1 inline-block h-3.5 w-3.5 text-sky-400" />;
    default:
      return null;
  }
};

export function ChatListItem({ chat, selected, onClick }: ChatListItemProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const isGroup = chat.remoteJid.endsWith("@g.us");
  const name = chat.pushName || formatJid(chat.remoteJid);
  const unread = chat.unreadCount || 0;
  const hasUnread = unread > 0;

  const timestamp = getChatTimestamp(chat);
  const formattedTime = formatChatTime(timestamp, t, locale);
  const snippet = getChatSnippet(chat.lastMessage, t);

  const isFromMe = !!chat.lastMessage?.key?.fromMe;
  const messageStatus = isFromMe ? getMessageStatus(chat.lastMessage) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-left transition-colors duration-150",
        selected
          ? "border-l-4 border-l-primary bg-accent/90"
          : "hover:bg-accent/50 border-b border-border/40",
      )}
    >
      {/* Contact Avatar */}
      <Avatar className="h-12 w-12 shrink-0 rounded-full border border-border/30">
        <AvatarImage src={chat.profilePicUrl || undefined} alt={name} />
        <AvatarFallback className="bg-muted text-muted-foreground">
          {isGroup ? <Users className="h-6 w-6" /> : <User className="h-6 w-6" />}
        </AvatarFallback>
      </Avatar>

      {/* Main Info */}
      <div className="min-w-0 flex-1">
        {/* Line 1: Name + Formatted Timestamp */}
        <div className="flex items-center justify-between gap-1">
          <p
            className={cn(
              "truncate text-sm tracking-tight text-foreground",
              hasUnread ? "font-semibold" : "font-medium",
            )}
          >
            {name}
          </p>
          {formattedTime && (
            <span
              className={cn(
                "shrink-0 text-[11px]",
                hasUnread
                  ? "font-semibold text-emerald-500 dark:text-emerald-400"
                  : "text-muted-foreground",
              )}
            >
              {formattedTime}
            </span>
          )}
        </div>

        {/* Line 2: Last Message Snippet + Unread Counter Badge */}
        <div className="mt-1 flex items-center justify-between gap-2">
          <div
            className={cn(
              "flex min-w-0 flex-1 items-center truncate text-xs",
              hasUnread
                ? "font-medium text-foreground"
                : "text-muted-foreground/90",
            )}
          >
            {isFromMe && <StatusTick status={messageStatus} />}
            <SnippetIcon icon={snippet.icon} />
            <span className="truncate">{snippet.text || formatJid(chat.remoteJid)}</span>
          </div>

          {/* Unread Message Count Badge (WhatsApp Web green badge) */}
          {hasUnread && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white shadow-xs">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>

        {/* Labels Tags */}
        {chat.labels && chat.labels.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {chat.labels.slice(0, 3).map((lbl, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-xs border border-primary/20 bg-primary/10 px-1 py-0 text-[10px] font-medium text-primary"
              >
                {lbl}
              </span>
            ))}
            {chat.labels.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{chat.labels.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
