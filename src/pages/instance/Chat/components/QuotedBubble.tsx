import { Message } from "@/types/evolution.types";
import { getMessageText } from "../utils/messageStatus";

export const getQuotedInfo = (message: Message) => {
  const msg = message.message;
  if (!msg) return null;
  const contextInfo =
    msg.extendedTextMessage?.contextInfo ||
    msg.imageMessage?.contextInfo ||
    msg.videoMessage?.contextInfo ||
    msg.audioMessage?.contextInfo ||
    msg.documentMessage?.contextInfo ||
    msg.contextInfo;

  if (contextInfo?.quotedMessage) {
    return {
      participant: contextInfo.participant as string | undefined,
      stanzaId: contextInfo.stanzaId as string | undefined,
      quotedMessage: contextInfo.quotedMessage,
    };
  }
  return null;
};

interface QuotedBubbleProps {
  quoted: ReturnType<typeof getQuotedInfo>;
  isFromMe: boolean;
  onQuoteClick?: (stanzaId?: string) => void;
}

export function QuotedBubble({ quoted, isFromMe, onQuoteClick }: QuotedBubbleProps) {
  if (!quoted) return null;

  const qText =
    getMessageText(quoted.quotedMessage) ||
    (quoted.quotedMessage.imageMessage
      ? "📷 Foto"
      : quoted.quotedMessage.videoMessage
      ? "🎥 Vídeo"
      : quoted.quotedMessage.audioMessage
      ? "🎵 Áudio"
      : quoted.quotedMessage.documentMessage
      ? "📄 Documento"
      : "Mensagem");

  const qAuthor = quoted.participant
    ? quoted.participant.split("@")[0]
    : isFromMe
    ? "Você"
    : "Contato";

  return (
    <div
      onClick={() => onQuoteClick?.(quoted.stanzaId)}
      className={`mb-2 cursor-pointer rounded-md border-l-4 px-2.5 py-1.5 text-xs transition-opacity hover:opacity-85 ${
        isFromMe
          ? "border-primary-foreground/80 bg-primary-foreground/15 text-primary-foreground"
          : "border-primary bg-muted/80 text-foreground"
      }`}
    >
      <div className="font-semibold text-[11px] opacity-90">{qAuthor}</div>
      <div className="truncate text-[11px]">{qText}</div>
    </div>
  );
}
