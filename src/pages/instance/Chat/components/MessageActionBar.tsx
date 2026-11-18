import { Pencil, Reply, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@evoapi/design-system/button";
import { Message } from "@/types/evolution.types";
import { canDeleteForEveryone, canEditMessage } from "../utils/messageRules";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface MessageActionBarProps {
  message: Message;
  isFromMe: boolean;
  onReact: (message: Message, emoji: string) => void;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
}

export function MessageActionBar({
  message,
  isFromMe,
  onReact,
  onReply,
  onEdit,
  onDelete,
}: MessageActionBarProps) {
  const { t } = useTranslation();

  const allowEdit = canEditMessage(message);
  const allowDelete = canDeleteForEveryone(message);

  return (
    <div
      className={`absolute -top-7 z-10 hidden items-center gap-1 rounded-full border border-border/60 bg-background/95 px-2 py-0.5 shadow-md backdrop-blur-xs group-hover:flex ${
        isFromMe ? "right-2" : "left-2"
      }`}
    >
      {/* Quick Reaction Emojis */}
      <div className="flex items-center gap-0.5 border-r border-border/60 pr-1">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact(message, emoji)}
            className="rounded-full p-1 text-xs transition-transform hover:scale-125"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Reply Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onReply(message)}
        className="h-6 w-6 text-muted-foreground hover:text-foreground"
        title={t("chat.reply.title", { defaultValue: "Responder" })}
      >
        <Reply className="h-3.5 w-3.5" />
      </Button>

      {/* Edit Button (WhatsApp Rule: only within 15 minutes of sending) */}
      {allowEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onEdit(message)}
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          title={t("chat.edit.action", { defaultValue: "Editar mensagem" })}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      )}

      {/* Delete for Everyone Button (WhatsApp Rule: only within 48 hours) */}
      {allowDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onDelete(message)}
          className="h-6 w-6 text-destructive hover:bg-destructive/10"
          title={t("chat.delete.action", { defaultValue: "Apagar para todos" })}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
