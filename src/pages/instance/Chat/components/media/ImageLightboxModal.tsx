import { useEffect, useState } from "react";
import { Download, X, ZoomIn, ZoomOut } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  senderName?: string;
  caption?: string;
  onDownload?: () => void;
}

export function ImageLightboxModal({
  isOpen,
  onClose,
  imageUrl,
  senderName,
  caption,
  onDownload,
}: ImageLightboxModalProps) {
  const { t } = useTranslation();
  const [scale, setScale] = useState(1);

  // Reset zoom on open
  useEffect(() => {
    if (isOpen) {
      setScale(1);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const resetZoom = () => setScale(1);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Header Toolbar */}
      <div
        className="flex w-full items-center justify-between px-6 py-4 text-white/90"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{senderName || "WhatsApp Media"}</span>
          <span className="text-xs text-white/60">
            {t("chat.media.preview", { defaultValue: "Preview" })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            className="flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/10 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={resetZoom}
            className="flex h-9 px-2 items-center justify-center rounded-md text-white text-xs font-mono hover:bg-white/10 transition-colors"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            type="button"
            onClick={zoomIn}
            className="flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/10 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/10 transition-colors ml-2"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/10 transition-colors ml-1"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div
        className="flex flex-1 items-center justify-center p-4 overflow-hidden w-full"
        onClick={onClose}
      >
        <img
          src={imageUrl}
          alt={caption || "Image preview"}
          style={{ transform: `scale(${scale})` }}
          className="max-h-[82vh] max-w-[90vw] object-contain transition-transform duration-150 cursor-grab active:cursor-grabbing select-none rounded-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Bottom Caption Bar */}
      {caption && (
        <div
          className="w-full max-w-2xl px-6 py-4 text-center text-sm text-white/90 bg-black/60 backdrop-blur-md rounded-t-xl mb-2"
          onClick={(e) => e.stopPropagation()}
        >
          {caption}
        </div>
      )}
    </div>
  );
}
