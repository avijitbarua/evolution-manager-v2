import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Message } from "@/types/evolution.types";
import { isMessageRevoked } from "../utils/messageRules";
import { getMessageText } from "../utils/messageStatus";
import { AudioMessageContent } from "./media/AudioMessageContent";
import { DocumentMessageContent } from "./media/DocumentMessageContent";
import { ImageMessageContent } from "./media/ImageMessageContent";
import { StickerMessageContent } from "./media/StickerMessageContent";
import { VideoMessageContent } from "./media/VideoMessageContent";

interface MessageContentProps {
  message: Message;
}

export function MessageContent({ message }: MessageContentProps) {
  const { t } = useTranslation();
  const messageType = message.messageType as string;

  if (isMessageRevoked(message)) {
    return (
      <span className="flex items-center gap-1.5 italic opacity-75">
        <Trash2 className="h-3.5 w-3.5" />
        {t("chat.delete.deleted", { defaultValue: "Esta mensagem foi apagada" })}
      </span>
    );
  }

  switch (messageType) {
    case "conversation":
      if (message.message?.contactMessage) {
        const contactMsg = message.message.contactMessage;
        return (
          <div className="max-w-xs rounded-lg bg-muted/50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xl">👤</span>
              <span className="font-medium">{contactMsg.displayName || "Contact"}</span>
            </div>
            {contactMsg.vcard && <p className="text-xs text-muted-foreground">vCard</p>}
          </div>
        );
      }

      if (message.message?.locationMessage) {
        const locationMsg = message.message.locationMessage;
        return (
          <div className="max-w-xs rounded-lg bg-muted/50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xl">📍</span>
              <span className="font-medium">{locationMsg.name || "Location"}</span>
            </div>
            {locationMsg.address && <p className="text-xs text-muted-foreground">{locationMsg.address}</p>}
            {locationMsg.degreesLatitude && locationMsg.degreesLongitude && (
              <a
                href={`https://maps.google.com/?q=${locationMsg.degreesLatitude},${locationMsg.degreesLongitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-primary hover:underline"
              >
                Google Maps
              </a>
            )}
          </div>
        );
      }

      return <span>{getMessageText(message.message)}</span>;

    case "extendedTextMessage":
      return (
        <span>
          {message.message?.conversation ??
            message.message?.extendedTextMessage?.text ??
            getMessageText(message.message)}
        </span>
      );

    case "imageMessage":
      return <ImageMessageContent message={message} />;

    case "audioMessage":
      return <AudioMessageContent message={message} />;

    case "videoMessage":
      return <VideoMessageContent message={message} />;

    case "documentMessage":
      return <DocumentMessageContent message={message} />;

    case "stickerMessage":
      return <StickerMessageContent message={message} />;

    default:
      return (
        <div className="max-w-xs rounded bg-muted/40 p-2 text-xs text-muted-foreground">
          <details>
            <summary>Type: {messageType}</summary>
            <pre className="mt-2 text-xs break-all whitespace-pre-wrap">
              {JSON.stringify(message.message, null, 2)}
            </pre>
          </details>
        </div>
      );
  }
}
