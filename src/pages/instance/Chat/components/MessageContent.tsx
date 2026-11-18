import { Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Message } from "@/types/evolution.types";
import { isMessageRevoked } from "../utils/messageRules";
import { getMessageText } from "../utils/messageStatus";

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

    case "imageMessage": {
      const imageBase64 = message.message?.base64
        ? message.message.base64.startsWith("data:")
          ? message.message.base64
          : `data:image/jpeg;base64,${message.message.base64}`
        : null;

      const imageSrc = imageBase64 || message.message?.mediaUrl;

      return (
        <div className="flex flex-col gap-2">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Imagem"
              className="h-auto max-w-full rounded-lg"
              style={{ maxWidth: "400px", maxHeight: "400px", objectFit: "contain" }}
              loading="lazy"
            />
          ) : (
            <div className="max-w-xs rounded bg-muted p-4">
              <p className="text-center text-muted-foreground">
                {t("chat.audio.notLoaded", { defaultValue: "Imagem não carregada" })}
              </p>
            </div>
          )}
          {message.message?.imageMessage?.caption && (
            <p className="text-sm">{message.message.imageMessage.caption}</p>
          )}
        </div>
      );
    }

    case "videoMessage": {
      const videoBase64 = message.message?.base64
        ? message.message.base64.startsWith("data:")
          ? message.message.base64
          : `data:video/mp4;base64,${message.message.base64}`
        : null;

      const videoSrc = videoBase64 || message.message?.mediaUrl;

      return (
        <div className="flex flex-col gap-2">
          {videoSrc ? (
            <video
              src={videoSrc}
              controls
              className="h-auto max-w-full rounded-lg"
              style={{ maxWidth: "400px", maxHeight: "400px" }}
            />
          ) : (
            <div className="max-w-xs rounded bg-muted p-4">
              <p className="text-center text-muted-foreground">Vídeo não carregado</p>
            </div>
          )}
          {message.message?.videoMessage?.caption && (
            <p className="text-sm">{message.message.videoMessage.caption}</p>
          )}
        </div>
      );
    }

    case "audioMessage": {
      const audioBase64 = message.message?.base64
        ? message.message.base64.startsWith("data:")
          ? message.message.base64
          : `data:audio/mpeg;base64,${message.message.base64}`
        : null;

      const audioSrc = audioBase64 || message.message?.mediaUrl;
      const transcription =
        (message as any).speechToText ||
        message.message?.speechToText ||
        message.message?.audioMessage?.speechToText ||
        (message.message as any)?.transcription;

      return (
        <div className="flex max-w-xs flex-col gap-2">
          {audioSrc ? (
            <audio controls className="w-full max-w-xs">
              <source src={audioSrc} type="audio/mpeg" />
              Your browser does not support audio playback.
            </audio>
          ) : (
            <div className="max-w-xs rounded bg-muted p-4">
              <p className="text-center text-muted-foreground">
                {t("chat.audio.notLoaded", { defaultValue: "Áudio não carregado" })}
              </p>
            </div>
          )}
          {transcription && (
            <div className="mt-1 rounded-md border border-border/50 bg-background/60 p-2 text-xs italic text-foreground/90 backdrop-blur-xs">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-[10px] text-primary not-italic">
                <Sparkles className="h-3 w-3" />
                <span>{t("chat.audio.transcription", { defaultValue: "Transcrição automática" })}</span>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{transcription}</p>
            </div>
          )}
        </div>
      );
    }

    case "documentMessage":
      return (
        <div className="flex max-w-xs items-center gap-2 rounded-lg bg-muted/50 p-3">
          <div className="text-2xl">📄</div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{message.message?.documentMessage?.fileName || "Document"}</p>
            {message.message?.documentMessage?.fileLength && (
              <p className="text-xs text-muted-foreground">
                {(message.message.documentMessage.fileLength / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
        </div>
      );

    case "stickerMessage":
      return (
        <img
          src={message.message?.mediaUrl}
          alt="Figurinha"
          className="max-h-32 max-w-32 object-contain"
        />
      );

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
