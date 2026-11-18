export interface CachedMedia {
  blobUrl: string;
  mimetype: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  base64?: string;
}

// In-memory media cache to avoid re-fetching media across component re-renders
const mediaCache = new Map<string, CachedMedia>();

export const getCachedMedia = (messageId: string): CachedMedia | undefined => {
  return mediaCache.get(messageId);
};

export const setCachedMedia = (messageId: string, data: CachedMedia): void => {
  mediaCache.set(messageId, data);
};

/**
 * Converts a base64 string to a browser Blob URL (blob:http://...)
 * Highly performant, seekable for audio/video, and avoids huge string memory overhead.
 */
export const base64ToBlobUrl = (base64Data: string, mimeType: string): string => {
  try {
    // Strip prefix if already formatted as data URL
    const pureBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
    const byteCharacters = atob(pureBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Failed to convert base64 to Blob URL:", error);
    // Fallback to data URI if Blob creation fails
    return base64Data.startsWith("data:") ? base64Data : `data:${mimeType};base64,${base64Data}`;
  }
};

/**
 * Programmatically triggers a browser download for a Blob or Data URL.
 */
export const downloadFile = (url: string, filename: string): void => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Formats byte size into human readable string (KB, MB, GB)
 */
export const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Formats seconds into mm:ss duration (e.g. 65 -> "1:05")
 */
export const formatAudioDuration = (seconds?: number): string => {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) {
    return "0:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};
