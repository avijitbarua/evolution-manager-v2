import { Message } from "@/types/evolution.types";
import { getMessageTimestamp } from "./messageStatus";

// Official WhatsApp: Messages can only be edited within 15 minutes of sending
export const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

// Official WhatsApp: Messages can be deleted for everyone within 48 hours
export const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export const canEditMessage = (message: Message): boolean => {
  if (!message.key?.fromMe) return false;
  if ((message as any).isRevoked || (message as any).isDeleted) return false;

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
  if ((message as any).isRevoked || (message as any).isDeleted) return false;

  const timestamp = getMessageTimestamp(message).getTime();
  const now = Date.now();
  const diffMs = now - timestamp;

  return diffMs <= FORTY_EIGHT_HOURS_MS;
};

export const isMessageEdited = (message: Message): boolean => {
  return (
    !!(message as any).isEdited ||
    !!message.message?.editedMessage ||
    !!message.message?.protocolMessage?.editedMessage
  );
};

export const isMessageRevoked = (message: Message): boolean => {
  return (
    !!(message as any).isRevoked ||
    !!(message as any).isDeleted ||
    message.messageType === "revoked" ||
    message.message?.protocolMessage?.type === 0 ||
    message.message?.conversation === "Esta mensagem foi apagada"
  );
};
