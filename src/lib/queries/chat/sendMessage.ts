import { SendText, SendMedia, SendAudio } from "@/types/evolution.types";

import { api } from "../api";
import { useManageMutation } from "../mutateQuery";

interface SendTextParams {
  instanceName: string;
  token: string;
  data: SendText;
}

interface SendMediaParams {
  instanceName: string;
  token: string;
  data: SendMedia;
}

interface SendAudioParams {
  instanceName: string;
  token: string;
  data: SendAudio;
}

const sendText = async ({ instanceName, token, data }: SendTextParams) => {
  const response = await api.post(`/message/sendText/${instanceName}`, data, {
    headers: {
      apikey: token,
      "content-type": "application/json",
    },
  });
  return response.data;
};

const sendMedia = async ({ instanceName, token, data }: SendMediaParams) => {
  try {
    // Send as flat structure as required by the newer API
    const jsonData = {
      number: data.number,
      mediatype: data.mediaMessage.mediatype,
      mimetype: data.mediaMessage.mimetype,
      caption: data.mediaMessage.caption,
      media: data.mediaMessage.media, // Base64 string
      fileName: data.mediaMessage.fileName,
    };

    const response = await api.post(`/message/sendMedia/${instanceName}`, jsonData, {
      headers: {
        apikey: token,
        "content-type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Erro ao enviar mídia:", error);
    throw error;
  }
};

const sendAudio = async ({ instanceName, token, data }: SendAudioParams) => {
  try {
    const audioData = (data as any).audio || data.audioMessage?.audio;
    // Always send as JSON with base64 audio and ensure top-level audio property
    const jsonData = {
      number: data.number,
      audio: audioData,
      audioMessage: {
        audio: audioData,
      },
      options: data.options,
      encoding: data.encoding ?? true,
      quoted: data.quoted,
    };

    const response = await api.post(`/message/sendWhatsAppAudio/${instanceName}`, jsonData, {
      headers: {
        apikey: token,
        "content-type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Erro ao enviar áudio:", error);
    throw error;
  }
};

export function useSendMessage() {
  const sendTextMutation = useManageMutation(sendText, {
    invalidateKeys: [
      ["chats", "findMessages"],
      ["chats", "findChats"],
    ],
  });

  return {
    sendText: sendTextMutation,
  };
}

export function useSendMedia() {
  const sendMediaMutation = useManageMutation(sendMedia);

  return {
    sendMedia: sendMediaMutation,
  };
}

export function useSendAudio() {
  const sendAudioMutation = useManageMutation(sendAudio);

  return {
    sendAudio: sendAudioMutation,
  };
}
