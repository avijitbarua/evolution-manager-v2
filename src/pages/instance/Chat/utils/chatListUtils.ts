import { Chat, Message } from "@/types/evolution.types";
import { getMessageText } from "./messageStatus";

export const formatJid = (remoteJid: string): string => {
  if (!remoteJid) return "";
  return remoteJid.split("@")[0];
};

/**
 * Extracts a normalized Unix timestamp in milliseconds for sorting chats.
 */
export const getChatTimestamp = (chat: Chat | any): number => {
  if (!chat) return 0;

  // 1. Try to get timestamp from lastMessage
  const lastMsg = chat.lastMessage;
  if (lastMsg) {
    const rawTs = lastMsg.messageTimestamp;
    if (typeof rawTs === "number") {
      return rawTs > 1000000000000 ? rawTs : rawTs * 1000;
    }
    if (typeof rawTs === "string" && !isNaN(Number(rawTs))) {
      const num = Number(rawTs);
      return num > 1000000000000 ? num : num * 1000;
    }
    if (typeof rawTs === "object" && rawTs !== null) {
      const val = (rawTs as any).low ?? (rawTs as any).seconds ?? (rawTs as any).timestamp;
      if (typeof val === "number") {
        return val > 1000000000000 ? val : val * 1000;
      }
    }
  }

  // 2. Try to get from chat updatedAt
  if (chat.updatedAt) {
    const time = new Date(chat.updatedAt).getTime();
    if (!isNaN(time) && time > 0) return time;
  }

  // 3. Try to get from chat createdAt
  if (chat.createdAt) {
    const time = new Date(chat.createdAt).getTime();
    if (!isNaN(time) && time > 0) return time;
  }

  return 0;
};

/**
 * Sorts chats in descending order (most recent message / activity first), exactly like WhatsApp Web.
 */
export const sortChatsByLatest = (chats: Chat[]): Chat[] => {
  return [...chats].sort((a, b) => {
    const timeA = getChatTimestamp(a);
    const timeB = getChatTimestamp(b);
    return timeB - timeA;
  });
};

/**
 * Formats time for the chat list (Today: HH:mm, Yesterday: Yesterday, This week: Weekday, Older: DD/MM/YYYY)
 */
export const formatChatTime = (
  timestamp: number | string | Date | undefined,
  t: (key: string, opts?: Record<string, unknown>) => string,
  locale: string = "pt-BR",
): string => {
  if (!timestamp) return "";

  let date: Date;
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === "number") {
    date = new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000);
  } else if (!isNaN(Number(timestamp))) {
    const num = Number(timestamp);
    date = new Date(num > 1000000000000 ? num : num * 1000);
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime()) || date.getTime() === 0) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const chatDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.round((today.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  if (diffDays === 1) {
    return t("chat.date.yesterday", { defaultValue: "Yesterday" });
  }

  if (diffDays > 1 && diffDays < 7) {
    return date.toLocaleDateString(locale, { weekday: "short" });
  }

  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

export type SnippetType = {
  text: string;
  icon?: "image" | "mic" | "video" | "document" | "sticker" | "location" | "contact" | "deleted" | "call";
};

/**
 * Returns a clean snippet for the last message with appropriate icon and preview text.
 */
export const getChatSnippet = (
  lastMessage: Message | null | undefined,
  t: (key: string, opts?: Record<string, unknown>) => string,
): SnippetType => {
  if (!lastMessage) {
    return { text: "" };
  }

  // Revoked / Deleted
  if ((lastMessage as any).isRevoked || lastMessage.messageType === "protocolMessage") {
    return {
      text: t("chat.delete.deleted", { defaultValue: "Esta mensagem foi apagada" }),
      icon: "deleted",
    };
  }

  const msgType = lastMessage.messageType || "";
  const content = lastMessage.message;

  if (msgType === "imageMessage" || content?.imageMessage) {
    const caption = content?.imageMessage?.caption || content?.caption;
    return {
      text: caption || t("chat.media.photosAndVideos", { defaultValue: "Foto" }),
      icon: "image",
    };
  }

  if (msgType === "audioMessage" || content?.audioMessage) {
    return {
      text: t("chat.audio.title", { defaultValue: "Áudio" }),
      icon: "mic",
    };
  }

  if (msgType === "videoMessage" || content?.videoMessage) {
    const caption = content?.videoMessage?.caption;
    return {
      text: caption || "Vídeo",
      icon: "video",
    };
  }

  if (msgType === "documentMessage" || content?.documentMessage) {
    const fileName = content?.documentMessage?.fileName || content?.fileName;
    return {
      text: fileName || "Documento",
      icon: "document",
    };
  }

  if (msgType === "stickerMessage" || content?.stickerMessage) {
    return {
      text: "Figurinha",
      icon: "sticker",
    };
  }

  if (msgType === "contactMessage" || content?.contactMessage) {
    const name = content?.contactMessage?.displayName;
    return {
      text: name || "Contato",
      icon: "contact",
    };
  }

  if (msgType === "locationMessage" || content?.locationMessage) {
    const loc = content?.locationMessage?.name;
    return {
      text: loc || "Localização",
      icon: "location",
    };
  }

  const text = getMessageText(content);
  return {
    text: text || "",
  };
};
