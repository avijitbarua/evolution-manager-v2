import { api } from "../api";

export interface GetBase64MediaResponse {
  mediaType: string;
  fileName?: string;
  caption?: string;
  size?: {
    fileLength?: number;
    height?: number;
    width?: number;
  };
  mimetype: string;
  base64: string;
  buffer?: any;
}

export interface GetBase64MediaParams {
  instanceName: string;
  message: any;
  convertToMp4?: boolean;
}

export const getBase64Media = async ({
  instanceName,
  message,
  convertToMp4 = false,
}: GetBase64MediaParams): Promise<GetBase64MediaResponse> => {
  // Pass minimal necessary message payload to Evolution API
  const payload = {
    message: {
      key: message.key,
      message: message.message,
    },
    convertToMp4,
  };

  const response = await api.post<GetBase64MediaResponse>(
    `/chat/getBase64FromMediaMessage/${instanceName}`,
    payload,
  );
  return response.data;
};
