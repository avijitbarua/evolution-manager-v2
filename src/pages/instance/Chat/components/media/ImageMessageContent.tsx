import { useState } from "react";
import { Download, Image as ImageIcon, Loader2, Maximize2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Message } from "@/types/evolution.types";
import { useMediaLoader } from "../../hooks/useMediaLoader";
import { ImageLightboxModal } from "./ImageLightboxModal";

interface ImageMessageContentProps {
  message: Message;
}

export function ImageMessageContent({ message }: ImageMessageContentProps) {
  const { t } = useTranslation();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const {
    mediaUrl,
    thumbnailUrl,
    isLoading,
    error,
    loadMedia,
    download,
  } = useMediaLoader(message, { autoLoad: true });

  const caption = message.message?.imageMessage?.caption;
  const activeImage = mediaUrl || thumbnailUrl;

  return (
    <div className="flex flex-col gap-1.5 max-w-[340px]">
      <div className="relative group overflow-hidden rounded-lg bg-black/10 dark:bg-white/5 border border-border/40">
        {activeImage ? (
          <div
            className="relative cursor-pointer overflow-hidden flex items-center justify-center min-h-[160px] max-h-[360px]"
            onClick={() => mediaUrl && setIsLightboxOpen(true)}
          >
            <img
              src={activeImage}
              alt={caption || "WhatsApp Image"}
              className={`w-full h-auto object-cover transition-all duration-300 ${
                !mediaUrl ? "blur-xs scale-102" : "blur-0 scale-100"
              }`}
              loading="lazy"
            />

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-2xs">
                <div className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white shadow-md">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t("chat.media.loading", { defaultValue: "Carregando..." })}</span>
                </div>
              </div>
            )}

            {/* Quick Action Overlay on Hover */}
            {mediaUrl && (
              <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  className="rounded-full bg-black/70 p-2 text-white hover:bg-black/90 transition-transform active:scale-95"
                  title="Expand"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    download();
                  }}
                  className="rounded-full bg-black/70 p-2 text-white hover:bg-black/90 transition-transform active:scale-95"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ) : error ? (
          /* Error State with Retry Button */
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mb-2 opacity-60" />
            <p className="text-xs mb-3 text-destructive">
              {t("chat.media.downloadFailed", { defaultValue: "Falha ao carregar imagem" })}
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
          /* Initial Placeholder */
          <div className="flex min-h-[140px] items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Caption */}
      {caption && (
        <p className="text-sm px-1 leading-relaxed break-words whitespace-pre-wrap">{caption}</p>
      )}

      {/* Lightbox Modal */}
      {mediaUrl && (
        <ImageLightboxModal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          imageUrl={mediaUrl}
          senderName={message.pushName}
          caption={caption}
          onDownload={download}
        />
      )}
    </div>
  );
}
