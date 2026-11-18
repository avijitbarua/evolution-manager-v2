import { Key } from "@/types/evolution.types";
import { api } from "../api";
import { useManageMutation } from "../mutateQuery";

export interface SendReactionParams {
  instanceName: string;
  token?: string;
  key: Key;
  reaction: string;
}

export interface DeleteMessageParams {
  instanceName: string;
  token?: string;
  id: string;
  remoteJid: string;
  fromMe: boolean;
  participant?: string;
}

export interface UpdateMessageParams {
  instanceName: string;
  token?: string;
  number: string;
  key: Key;
  text: string;
}

export interface SendPresenceParams {
  instanceName: string;
  token?: string;
  number: string;
  presence: "composing" | "recording" | "paused";
  delay?: number;
}

export interface ChangeBotStatusParams {
  instanceName: string;
  token?: string;
  remoteJid: string;
  status: "opened" | "paused" | "closed";
}

export interface LabelItem {
  id: string;
  name: string;
  color: string;
  predefinedId?: string;
}

export interface HandleLabelParams {
  instanceName: string;
  token?: string;
  number: string;
  labelId: string;
  action: "add" | "remove";
}

export interface ReadMessageKey {
  id: string;
  fromMe: boolean;
  remoteJid: string;
}

export interface MarkMessageAsReadParams {
  instanceName: string;
  token?: string;
  readMessages: ReadMessageKey[];
}

export const sendReaction = async ({ instanceName, token, key, reaction }: SendReactionParams) => {
  const response = await api.post(
    `/message/sendReaction/${instanceName}`,
    { key, reaction },
    token ? { headers: { apikey: token } } : undefined,
  );
  return response.data;
};

export const deleteMessageForEveryone = async ({
  instanceName,
  token,
  id,
  remoteJid,
  fromMe,
  participant,
}: DeleteMessageParams) => {
  const response = await api.delete(`/chat/deleteMessageForEveryone/${instanceName}`, {
    headers: token ? { apikey: token } : undefined,
    data: { id, remoteJid, fromMe, participant },
  });
  return response.data;
};

export const updateMessage = async ({ instanceName, token, number, key, text }: UpdateMessageParams) => {
  const response = await api.post(
    `/chat/updateMessage/${instanceName}`,
    { number, key, text },
    token ? { headers: { apikey: token } } : undefined,
  );
  return response.data;
};

export const sendPresence = async ({
  instanceName,
  token,
  number,
  presence,
  delay = 1200,
}: SendPresenceParams) => {
  try {
    const response = await api.post(
      `/chat/sendPresence/${instanceName}`,
      { number, presence, delay },
      token ? { headers: { apikey: token } } : undefined,
    );
    return response.data;
  } catch (error) {
    // Non-blocking for presence
    console.warn("sendPresence error:", error);
    return null;
  }
};

export const changeBotStatus = async ({ instanceName, token, remoteJid, status }: ChangeBotStatusParams) => {
  const response = await api.post(
    `/typebot/changeStatus/${instanceName}`,
    { remoteJid, status },
    token ? { headers: { apikey: token } } : undefined,
  );
  return response.data;
};

export const fetchLabels = async ({
  instanceName,
  token,
}: {
  instanceName: string;
  token?: string;
}): Promise<LabelItem[]> => {
  try {
    const response = await api.get(
      `/label/findLabels/${instanceName}`,
      token ? { headers: { apikey: token } } : undefined,
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.warn("fetchLabels error:", error);
    return [];
  }
};

export const handleLabel = async ({ instanceName, token, number, labelId, action }: HandleLabelParams) => {
  const response = await api.post(
    `/label/handleLabel/${instanceName}`,
    { number, labelId, action },
    token ? { headers: { apikey: token } } : undefined,
  );
  return response.data;
};

export const markMessageAsRead = async ({ instanceName, token, readMessages }: MarkMessageAsReadParams) => {
  try {
    const response = await api.post(
      `/chat/markMessageAsRead/${instanceName}`,
      { readMessages },
      token ? { headers: { apikey: token } } : undefined,
    );
    return response.data;
  } catch (error) {
    console.warn("markMessageAsRead error:", error);
    return null;
  }
};

export function useChatActions() {
  const reactionMutation = useManageMutation(sendReaction);
  const deleteMutation = useManageMutation(deleteMessageForEveryone);
  const updateMutation = useManageMutation(updateMessage);
  const botStatusMutation = useManageMutation(changeBotStatus);
  const handleLabelMutation = useManageMutation(handleLabel, {
    invalidateKeys: [["chats", "findChats"]],
  });

  return {
    sendReaction: reactionMutation,
    deleteMessage: deleteMutation,
    updateMessage: updateMutation,
    changeBotStatus: botStatusMutation,
    handleLabel: handleLabelMutation,
  };
}
