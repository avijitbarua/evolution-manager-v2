import { api } from "../api";

interface IArchiveChatParams {
  instanceName: string;
  token?: string;
  chat: string;
  archive: boolean;
}

export const archiveChatApi = async ({
  instanceName,
  token,
  chat,
  archive,
}: IArchiveChatParams) => {
  try {
    const headers: Record<string, string> = {};
    if (token) headers["apikey"] = token;

    const response = await api.post(
      `/chat/archiveChat/${instanceName}`,
      {
        chat,
        archive,
      },
      { headers },
    );
    return response.data;
  } catch (error) {
    console.warn("archiveChat API warning (fallback active):", error);
    return { chatId: chat, archived: archive, fallback: true };
  }
};
