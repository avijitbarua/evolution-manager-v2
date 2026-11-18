import { Download, Film, Loader2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Message } from "@/types/evolution.types";
import { useMediaLoader } from "../../hooks/useMediaLoader";

interface VideoMessageContentProps {
  message: Message;
}

export function VideoMessageContent({ message }: VideoMessageContentProps) {
  const { t } = useTranslation();

  const {
    mediaUrl,
    thumbnailUrl,
    isLoading,
    error,
    loadMedia,
    download,
  } = useMediaLoader(message, { autoLoad: true });

  const caption = message.message?.videoMessage?.caption;

  return (
    <div className="flex flex-col gap-1.5 max-w-[340px]">
      <div className="relative group overflow-hidden rounded-lg bg-black/10 dark:bg-white/5 border border-border/40">
        {mediaUrl ? (
          <div className="relative">
            <video
              src={mediaUrl}
              controls
              className="w-full h-auto max-h-[360px] rounded-lg object-contain bg-black"
              preload="metadata"
            />
            <button
              type="button"
              onClick={() => download()}
              className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
              title="Download video"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : thumbnailUrl ? (
          <div className="relative min-h-[160px] max-h-[360px] flex items-center justify-center">
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              className="w-full h-auto object-cover blur-2xs"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              {isLoading ? (
                <div className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t("chat.media.loading", { defaultValue: "Carregando..." })}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={loadMedia}
                  className="rounded-full bg-primary p-3 text-primary-foreground shadow-lg hover:scale-105 transition-transform"
                >
                  <Film className="h-6 w-6" />
                </button>
              )}
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <Film className="h-8 w-8 mb-2 opacity-60" />
            <p className="text-xs mb-3 text-destructive">
              {t("chat.media.downloadFailed", { defaultValue: "Falha ao carregar vídeo" })}
            </p>
            <button
              type="button"
              onClick={loadMedia}
              className="flex items-center gap-1.5 rounded-md bg-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/30 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              <span>{t("chat.media.retry", { defaultValue: "Tentar novamente" })}</span>
            </button>
          </div>
        ) : (
          <div className="flex min-h-[140px] items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {caption && (
        <p className="text-sm px-1 leading-relaxed break-words whitespace-pre-wrap">{caption}</p>
      )}
    </div>
  );
}
