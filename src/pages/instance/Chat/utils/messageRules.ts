import { Message } from "@/types/evolution.types";
import { getMessageTimestamp } from "./messageStatus";

// Official WhatsApp: Messages can only be edited within 15 minutes of sending
export const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

// Official WhatsApp: Messages can be deleted for everyone within 48 hours
export const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export const canEditMessage = (message: Message): boolean => {
  if (!message.key?.fromMe) return false;
  if (isMessageRevoked(message)) return false;

  // Only text messages can be edited
  const isText =
    message.messageType === "conversation" || message.messageType === "extendedTextMessage";
  if (!isText) return false;

  const timestamp = getMessageTimestamp(message).getTime();
  const now = Date.now();
  const diffMs = now - timestamp;

  return diffMs <= FIFTEEN_MINUTES_MS;
};

export const canDeleteForEveryone = (message: Message): boolean => {
  if (!message.key?.fromMe) return false;
  if (isMessageRevoked(message)) return false;

  const timestamp = getMessageTimestamp(message).getTime();
  const now = Date.now();
  const diffMs = now - timestamp;

  return diffMs <= FORTY_EIGHT_HOURS_MS;
};

export const isMessageEdited = (message: any): boolean => {
  if (!message) return false;
  if (message.isEdited) return true;
  if (message.status === "EDITED") return true;
  if (message.message?.editedMessage) return true;
  if (message.message?.protocolMessage?.editedMessage) return true;
  if (Array.isArray(message.MessageUpdate)) {
    return message.MessageUpdate.some((u: any) => u.status === "EDITED");
  }
  return false;
};

export const isMessageRevoked = (message: any): boolean => {
  if (!message) return false;
  return (
    !!message.isRevoked ||
    !!message.isDeleted ||
    message.status === "DELETED" ||
    message.messageType === "revoked" ||
    message.message?.protocolMessage?.type === 0 ||
    message.message?.conversation === "Esta mensagem foi apagada"
  );
};
