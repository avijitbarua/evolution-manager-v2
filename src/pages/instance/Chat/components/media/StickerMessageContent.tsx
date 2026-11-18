import { Loader2 } from "lucide-react";
import { Message } from "@/types/evolution.types";
import { useMediaLoader } from "../../hooks/useMediaLoader";

interface StickerMessageContentProps {
  message: Message;
}

export function StickerMessageContent({ message }: StickerMessageContentProps) {
  const {
    mediaUrl,
    thumbnailUrl,
    isLoading,
  } = useMediaLoader(message, { autoLoad: true });

  const activeSrc = mediaUrl || thumbnailUrl || message.message?.mediaUrl;

  if (activeSrc) {
    return (
      <img
        src={activeSrc}
        alt="Sticker"
        className="h-32 w-32 object-contain select-none"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5">
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <span className="text-2xl">🏷️</span>
      )}
    </div>
  );
}
