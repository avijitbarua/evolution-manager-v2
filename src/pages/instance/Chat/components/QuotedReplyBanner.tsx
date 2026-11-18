import { Reply, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@evoapi/design-system/button";
import { Message } from "@/types/evolution.types";
import { getMessageText } from "../utils/messageStatus";

interface QuotedReplyBannerProps {
  replyingTo: Message | null;
  onCancel: () => void;
}

export function QuotedReplyBanner({ replyingTo, onCancel }: QuotedReplyBannerProps) {
  const { t } = useTranslation();

  if (!replyingTo) return null;

  const author = replyingTo.key?.fromMe
    ? t("chat.reply.you", { defaultValue: "Você" })
    : replyingTo.pushName ||
      replyingTo.key?.participant?.split("@")[0] ||
      t("chat.reply.contact", { defaultValue: "Contato" });

  const snippet =
    getMessageText(replyingTo.message) ||
    t("chat.reply.media", { defaultValue: "Mídia / Anexo" });

  return (
    <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-3 py-1.5 text-xs">
      <div className="flex min-w-0 items-center gap-2 overflow-hidden border-l-4 border-primary pl-2">
        <Reply className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
        <div className="min-w-0 overflow-hidden">
          <p className="truncate font-semibold text-primary">{author}</p>
          <p className="truncate text-[11px] text-muted-foreground">{snippet}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onCancel}
        className="h-6 w-6 text-muted-foreground hover:text-foreground"
        title={t("chat.reply.cancel", { defaultValue: "Cancelar resposta" })}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
