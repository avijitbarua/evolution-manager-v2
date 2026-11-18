import { Message } from "@/types/evolution.types";

/**
 * WhatsApp message status enum:
 * 1: PENDING (Clock - sending)
 * 2: SERVER_ACK (Single Check - Sent to WhatsApp server)
 * 3: DELIVERY_ACK (Double Gray Check - Delivered to recipient)
 * 4: READ (Double Blue Check - Seen/Read by recipient)
 * 5: PLAYED (Double Blue Check - Played audio voice note)
 */
export const getMessageStatus = (message: any): number => {
  if (!message) return 0;

  let highest = 0;

  // Check MessageUpdate history array from database if present
  if (Array.isArray(message.MessageUpdate) && message.MessageUpdate.length > 0) {
    for (const update of message.MessageUpdate) {
      const u = update?.status;
      const uNum = typeof u === "number" ? u : parseInt(u, 10);
      if (u === "READ" || u === "PLAYED" || uNum === 4 || uNum === 5) {
        highest = Math.max(highest, 4);
      } else if (u === "DELIVERY_ACK" || uNum === 3) {
        highest = Math.max(highest, 3);
      } else if (u === "SERVER_ACK" || uNum === 2) {
        highest = Math.max(highest, 2);
      } else if (u === "PENDING" || uNum === 1) {
        highest = Math.max(highest, 1);
      }
    }
  }

  // Check direct message status property
  const raw = message.status;
  const sNum = typeof raw === "number" ? raw : parseInt(raw, 10);

  if (raw === "READ" || raw === "PLAYED" || sNum === 4 || sNum === 5) {
    highest = Math.max(highest, 4);
  } else if (raw === "DELIVERY_ACK" || sNum === 3) {
    highest = Math.max(highest, 3);
  } else if (raw === "SERVER_ACK" || sNum === 2) {
    highest = Math.max(highest, 2);
  } else if (raw === "PENDING" || sNum === 1) {
    highest = Math.max(highest, 1);
  }

  if (highest > 0) return highest;

  // If outgoing message fromMe and exists in chat history, it was acknowledged by server at least
  if (message.key?.fromMe) {
    return 2; // Sent (single check ✓)
  }

  return 0;
};

export const getMessageTimestamp = (message: Message): Date => {
  try {
    if (!message.messageTimestamp) {
      return new Date();
    }

    if (typeof message.messageTimestamp === "object") {
      const possibleTimestamps = [
        (message.messageTimestamp as any).low,
        (message.messageTimestamp as any).seconds,
        (message.messageTimestamp as any).timestamp,
        (message.messageTimestamp as any).time,
        (message.messageTimestamp as any).value,
      ];

      const timestamp =
        possibleTimestamps.find((val) => typeof val === "number" && !isNaN(val)) ||
        Date.now() / 1000;
      return new Date(timestamp * 1000);
    } else if (!isNaN(Number(message.messageTimestamp))) {
      const timestamp = Number(message.messageTimestamp);
      if (timestamp > 1000000000000) {
        return new Date(timestamp);
      } else {
        return new Date(timestamp * 1000);
      }
    } else if (
      typeof message.messageTimestamp === "string" &&
      message.messageTimestamp.includes("T")
    ) {
      return new Date(message.messageTimestamp);
    }

    return new Date();
  } catch {
    return new Date();
  }
};

export const formatMessageTime = (date: Date, locale: string): string =>
  date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

export const formatDateSeparator = (
  date: Date,
  t: (key: string, opts?: Record<string, unknown>) => string,
  locale: string,
): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDate = new Date(date);

  if (messageDate.toDateString() === today.toDateString()) {
    return t("chat.date.today", { defaultValue: "Hoje" });
  }

  if (messageDate.toDateString() === yesterday.toDateString()) {
    return t("chat.date.yesterday", { defaultValue: "Ontem" });
  }

  const daysDiff = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    return messageDate.toLocaleDateString(locale, { weekday: "long" });
  }

  return messageDate.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const getMessageText = (messageObj: any): string => {
  if (!messageObj) return "";
  if (typeof messageObj === "string") {
    try {
      const parsed = JSON.parse(messageObj);
      return parsed.conversation || parsed.text || messageObj;
    } catch {
      return messageObj;
    }
  }
  if (typeof messageObj === "object") {
    return (
      messageObj.conversation ||
      messageObj.extendedTextMessage?.text ||
      messageObj.text ||
      messageObj.imageMessage?.caption ||
      messageObj.videoMessage?.caption ||
      messageObj.documentMessage?.fileName ||
      ""
    );
  }
  return String(messageObj);
};

const SENDER_COLORS = [
  "#e91e63", "#9c27b0", "#3f51b5", "#2196f3", "#00bcd4",
  "#009688", "#4caf50", "#ff9800", "#f44336", "#795548",
];

export const getSenderColor = (key: string): string => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
};
