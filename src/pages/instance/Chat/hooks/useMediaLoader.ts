import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useInstance } from "@/contexts/InstanceContext";
import { getBase64Media } from "@/lib/queries/chat/getBase64Media";
import { Message } from "@/types/evolution.types";
import {
  base64ToBlobUrl,
  CachedMedia,
  downloadFile,
  getCachedMedia,
  setCachedMedia,
} from "../utils/mediaCache";

interface UseMediaLoaderOptions {
  autoLoad?: boolean;
  convertToMp4?: boolean;
}

export function useMediaLoader(message: Message, options: UseMediaLoaderOptions = {}) {
  const { autoLoad = true, convertToMp4 = false } = options;
  const { instance } = useInstance();
  const { instanceName: routeInstanceName } = useParams<{ instanceName?: string }>();
  const activeInstanceName = instance?.name || routeInstanceName || "whatsapp";

  const messageId = message.key?.id || message.id || "";
  const messageType = message.messageType as string;

  // Extract thumbnail if available on raw message payload
  const rawThumbnail = useMemo(() => {
    const rawJpeg =
      message.message?.imageMessage?.jpegThumbnail ||
      message.message?.videoMessage?.jpegThumbnail;
    if (!rawJpeg) return null;
    return rawJpeg.startsWith("data:") ? rawJpeg : `data:image/jpeg;base64,${rawJpeg}`;
  }, [message]);

  // Extract file size and duration if present
  const meta = useMemo(() => {
    const raw =
      message.message?.imageMessage ||
      message.message?.audioMessage ||
      message.message?.videoMessage ||
      message.message?.documentMessage;

    const fileLength =
      typeof raw?.fileLength === "number"
        ? raw.fileLength
        : typeof raw?.fileLength?.low === "number"
        ? raw.fileLength.low
        : undefined;

    const duration = raw?.seconds;
    const fileName = raw?.fileName;
    const mimetype = raw?.mimetype;

    return { fileLength, duration, fileName, mimetype };
  }, [message]);

  const [mediaData, setMediaData] = useState<CachedMedia | null>(() => {
    if (!messageId) return null;
    // Check in-memory cache first
    const cached = getCachedMedia(messageId);
    if (cached) return cached;

    // Check if message already has base64 attached
    const directBase64 =
      message.message?.base64 ||
      message.message?.imageMessage?.base64 ||
      message.message?.audioMessage?.base64 ||
      message.message?.videoMessage?.base64;

    if (directBase64) {
      const mime = meta.mimetype || (messageType === "audioMessage" ? "audio/ogg" : "image/jpeg");
      const blobUrl = base64ToBlobUrl(directBase64, mime);
      const cachedItem: CachedMedia = {
        blobUrl,
        mimetype: mime,
        fileName: meta.fileName,
        fileSize: meta.fileLength,
        duration: meta.duration,
        base64: directBase64,
      };
      setCachedMedia(messageId, cachedItem);
      return cachedItem;
    }

    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadMedia = useCallback(async () => {
    if (!messageId || mediaData) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await getBase64Media({
        instanceName: activeInstanceName,
        message,
        convertToMp4,
      });

      if (!res?.base64) {
        throw new Error("Empty media received");
      }

      const mime = res.mimetype || meta.mimetype || "application/octet-stream";
      const blobUrl = base64ToBlobUrl(res.base64, mime);

      const cachedItem: CachedMedia = {
        blobUrl,
        mimetype: mime,
        fileName: res.fileName || meta.fileName,
        fileSize: res.size?.fileLength || meta.fileLength,
        duration: meta.duration,
        base64: res.base64,
      };

      setCachedMedia(messageId, cachedItem);
      setMediaData(cachedItem);
    } catch (err: any) {
      console.error(`Failed to load media for message ${messageId}:`, err);
      setError(err?.message || "Erro ao carregar mídia");
    } finally {
      setIsLoading(false);
    }
  }, [messageId, mediaData, activeInstanceName, message, convertToMp4, meta]);

  // Auto-fetch if requested and not yet loaded
  useEffect(() => {
    if (autoLoad && !mediaData && !isLoading && !error && messageId) {
      loadMedia();
    }
  }, [autoLoad, mediaData, isLoading, error, messageId, loadMedia]);

  const download = useCallback(
    (customName?: string) => {
      if (!mediaData?.blobUrl) return;
      const extension = mediaData.mimetype ? mediaData.mimetype.split("/")[1]?.split(";")[0] : "bin";
      const name = customName || mediaData.fileName || meta.fileName || `media-${messageId}.${extension}`;
      downloadFile(mediaData.blobUrl, name);
    },
    [mediaData, meta.fileName, messageId],
  );

  return {
    mediaUrl: mediaData?.blobUrl || null,
    thumbnailUrl: rawThumbnail,
    mimetype: mediaData?.mimetype || meta.mimetype || null,
    fileName: mediaData?.fileName || meta.fileName || null,
    fileSize: mediaData?.fileSize || meta.fileLength || null,
    duration: mediaData?.duration || meta.duration || null,
    isLoading,
    error,
    loadMedia,
    download,
  };
}
