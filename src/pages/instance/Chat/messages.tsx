import {
  Bot,
  BotOff,
  Check,
  CheckCheck,
  Clock,
  Mic,
  Pencil,
  Reply,
  Send,
  Sparkles,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@evoapi/design-system/avatar";
import { Badge } from "@evoapi/design-system/badge";
import { Button } from "@evoapi/design-system/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@evoapi/design-system/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { useInstance } from "@/contexts/InstanceContext";

import {
  fetchLabels,
  LabelItem,
  sendPresence,
  useChatActions,
} from "@/lib/queries/chat/chatActions";
import { useFindChat } from "@/lib/queries/chat/findChat";
import { useFindMessages } from "@/lib/queries/chat/findMessages";
import {
  useSendAudio,
  useSendMedia,
  useSendMessage,
} from "@/lib/queries/chat/sendMessage";
import { getToken, TOKEN_ID } from "@/lib/queries/token";

import { Message } from "@/types/evolution.types";

import { connectSocket, disconnectSocket } from "@/services/websocket/socket";

import { MediaOptions } from "../EmbedChatMessage/InputMessage/media-options";
import { SelectedMedia } from "../EmbedChatMessage/InputMessage/selected-media";

type MessagesProps = {
  textareaRef: RefObject<HTMLTextAreaElement>;
  handleTextareaChange: () => void;
  textareaHeight: string;
  lastMessageRef: RefObject<HTMLDivElement>;
  scrollToBottom: () => void;
};

type TFn = (key: string, opts?: Record<string, unknown>) => string;

const formatDateSeparator = (date: Date, t: TFn, locale: string): string => {
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

const getMessageTimestamp = (message: Message): Date => {
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

      const timestamp = possibleTimestamps.find((val) => typeof val === "number" && !isNaN(val)) || Date.now() / 1000;
      return new Date(timestamp * 1000);
    } else if (!isNaN(Number(message.messageTimestamp))) {
      const timestamp = Number(message.messageTimestamp);
      if (timestamp > 1000000000000) {
        return new Date(timestamp);
      } else {
        return new Date(timestamp * 1000);
      }
    } else if (typeof message.messageTimestamp === "string" && message.messageTimestamp.includes("T")) {
      return new Date(message.messageTimestamp);
    }

    return new Date();
  } catch {
    return new Date();
  }
};

const DateSeparator = ({ date }: { date: string }) => (
  <div className="flex items-center justify-center py-3">
    <div className="rounded-full bg-muted/60 px-3 py-1 shadow-xs backdrop-blur-xs">
      <span className="text-xs font-medium text-muted-foreground">{date}</span>
    </div>
  </div>
);

const formatMessageTime = (date: Date, locale: string): string =>
  date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

const SENDER_COLORS = [
  "#e91e63", "#9c27b0", "#3f51b5", "#2196f3", "#00bcd4",
  "#009688", "#4caf50", "#ff9800", "#f44336", "#795548",
];

const getSenderColor = (key: string): string => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
};

const getMessageText = (messageObj: any): string => {
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

const getQuotedInfo = (message: Message) => {
  const msg = message.message;
  if (!msg) return null;
  const contextInfo =
    msg.extendedTextMessage?.contextInfo ||
    msg.imageMessage?.contextInfo ||
    msg.videoMessage?.contextInfo ||
    msg.audioMessage?.contextInfo ||
    msg.documentMessage?.contextInfo ||
    msg.contextInfo;

  if (contextInfo?.quotedMessage) {
    return {
      participant: contextInfo.participant as string | undefined,
      stanzaId: contextInfo.stanzaId as string | undefined,
      quotedMessage: contextInfo.quotedMessage,
    };
  }
  return null;
};

const QuotedBubble = ({
  quoted,
  isFromMe,
  onQuoteClick,
}: {
  quoted: ReturnType<typeof getQuotedInfo>;
  isFromMe: boolean;
  onQuoteClick?: (stanzaId?: string) => void;
}) => {
  if (!quoted) return null;

  const qText =
    getMessageText(quoted.quotedMessage) ||
    (quoted.quotedMessage.imageMessage
      ? "📷 Foto"
      : quoted.quotedMessage.videoMessage
      ? "🎥 Vídeo"
      : quoted.quotedMessage.audioMessage
      ? "🎵 Áudio"
      : quoted.quotedMessage.documentMessage
      ? "📄 Documento"
      : "Mensagem");

  const qAuthor = quoted.participant ? quoted.participant.split("@")[0] : (isFromMe ? "Você" : "Contato");

  return (
    <div
      onClick={() => onQuoteClick?.(quoted.stanzaId)}
      className={`mb-2 cursor-pointer rounded-md border-l-4 px-2.5 py-1.5 text-xs transition-opacity hover:opacity-85 ${
        isFromMe
          ? "border-primary-foreground/80 bg-primary-foreground/15 text-primary-foreground"
          : "border-primary bg-muted/80 text-foreground"
      }`}
    >
      <div className="font-semibold text-[11px] opacity-90">{qAuthor}</div>
      <div className="truncate text-[11px]">{qText}</div>
    </div>
  );
};

const MessageContent = ({ message }: { message: Message }) => {
  const messageType = message.messageType as string;

  if ((message as any).isRevoked || (message as any).isDeleted) {
    return (
      <span className="flex items-center gap-1.5 italic opacity-75">
        <Trash2 className="h-3.5 w-3.5" />
        Esta mensagem foi apagada
      </span>
    );
  }

  switch (messageType) {
    case "conversation":
      if (message.message?.contactMessage) {
        const contactMsg = message.message.contactMessage;
        return (
          <div className="max-w-xs rounded-lg bg-muted/50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xl">👤</span>
              <span className="font-medium">Contato</span>
            </div>
            {contactMsg.displayName && <p className="text-sm font-medium">{contactMsg.displayName}</p>}
            {contactMsg.vcard && <p className="text-xs text-muted-foreground">Cartão de contato</p>}
          </div>
        );
      }

      if (message.message?.locationMessage) {
        const locationMsg = message.message.locationMessage;
        return (
          <div className="max-w-xs rounded-lg bg-muted/50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xl">📍</span>
              <span className="font-medium">Localização</span>
            </div>
            {locationMsg.name && <p className="text-sm font-medium">{locationMsg.name}</p>}
            {locationMsg.address && <p className="text-xs text-muted-foreground">{locationMsg.address}</p>}
            {locationMsg.degreesLatitude && locationMsg.degreesLongitude && (
              <a
                href={`https://maps.google.com/?q=${locationMsg.degreesLatitude},${locationMsg.degreesLongitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-primary hover:underline"
              >
                Ver no Google Maps
              </a>
            )}
          </div>
        );
      }

      return <span>{getMessageText(message.message)}</span>;

    case "extendedTextMessage":
      return <span>{message.message?.conversation ?? message.message?.extendedTextMessage?.text ?? getMessageText(message.message)}</span>;

    case "imageMessage": {
      const imageBase64 = message.message?.base64
        ? message.message.base64.startsWith("data:")
          ? message.message.base64
          : `data:image/jpeg;base64,${message.message.base64}`
        : null;

      const imageSrc = imageBase64 || message.message?.mediaUrl;

      return (
        <div className="flex flex-col gap-2">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Imagem"
              className="h-auto max-w-full rounded-lg"
              style={{ maxWidth: "400px", maxHeight: "400px", objectFit: "contain" }}
              loading="lazy"
            />
          ) : (
            <div className="max-w-xs rounded bg-muted p-4">
              <p className="text-center text-muted-foreground">Imagem não carregada</p>
            </div>
          )}
          {message.message?.imageMessage?.caption && (
            <p className="text-sm">{message.message.imageMessage.caption}</p>
          )}
        </div>
      );
    }

    case "videoMessage": {
      const videoBase64 = message.message?.base64
        ? message.message.base64.startsWith("data:")
          ? message.message.base64
          : `data:video/mp4;base64,${message.message.base64}`
        : null;

      const videoSrc = videoBase64 || message.message?.mediaUrl;

      return (
        <div className="flex flex-col gap-2">
          {videoSrc ? (
            <video
              src={videoSrc}
              controls
              className="h-auto max-w-full rounded-lg"
              style={{ maxWidth: "400px", maxHeight: "400px" }}
            />
          ) : (
            <div className="max-w-xs rounded bg-muted p-4">
              <p className="text-center text-muted-foreground">Vídeo não carregado</p>
            </div>
          )}
          {message.message?.videoMessage?.caption && (
            <p className="text-sm">{message.message.videoMessage.caption}</p>
          )}
        </div>
      );
    }

    case "audioMessage": {
      const audioBase64 = message.message?.base64
        ? message.message.base64.startsWith("data:")
          ? message.message.base64
          : `data:audio/mpeg;base64,${message.message.base64}`
        : null;

      const audioSrc = audioBase64 || message.message?.mediaUrl;
      const transcription =
        (message as any).speechToText ||
        message.message?.speechToText ||
        message.message?.audioMessage?.speechToText ||
        (message.message as any)?.transcription;

      return (
        <div className="flex max-w-xs flex-col gap-2">
          {audioSrc ? (
            <audio controls className="w-full max-w-xs">
              <source src={audioSrc} type="audio/mpeg" />
              Seu navegador não suporta reprodução de áudio.
            </audio>
          ) : (
            <div className="max-w-xs rounded bg-muted p-4">
              <p className="text-center text-muted-foreground">Áudio não carregado</p>
            </div>
          )}
          {transcription && (
            <div className="mt-1 rounded-md border border-border/50 bg-background/60 p-2 text-xs italic text-foreground/90 backdrop-blur-xs">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-[10px] text-primary not-italic">
                <Sparkles className="h-3 w-3" />
                <span>Transcrição automática</span>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{transcription}</p>
            </div>
          )}
        </div>
      );
    }

    case "documentMessage":
      return (
        <div className="flex max-w-xs items-center gap-2 rounded-lg bg-muted/50 p-3">
          <div className="text-2xl">📄</div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{message.message?.documentMessage?.fileName || "Documento"}</p>
            {message.message?.documentMessage?.fileLength && (
              <p className="text-xs text-muted-foreground">
                {(message.message.documentMessage.fileLength / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
        </div>
      );

    case "stickerMessage":
      return (
        <img
          src={message.message?.mediaUrl}
          alt="Figurinha"
          className="max-h-32 max-w-32 object-contain"
        />
      );

    default:
      return (
        <div className="max-w-xs rounded bg-muted/40 p-2 text-xs text-muted-foreground">
          <details>
            <summary>Tipo de mensagem: {messageType}</summary>
            <pre className="mt-2 text-xs break-all whitespace-pre-wrap">
              {JSON.stringify(message.message, null, 2)}
            </pre>
          </details>
        </div>
      );
  }
};

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function Messages({
  textareaRef,
  handleTextareaChange,
  textareaHeight,
  lastMessageRef,
  scrollToBottom,
}: MessagesProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { instance } = useInstance();
  const { remoteJid } = useParams<{ remoteJid: string }>();

  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);

  // Reply / Quoted message state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time typing presence state
  const [contactPresence, setContactPresence] = useState<"composing" | "recording" | null>(null);
  const presenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPresenceSentRef = useRef<number>(0);

  // Chatbot takeover state
  const [isBotPaused, setIsBotPaused] = useState(false);

  // Labels state
  const [availableLabels, setAvailableLabels] = useState<LabelItem[]>([]);
  const [chatLabels, setChatLabels] = useState<string[]>([]);

  // Edit & Delete modal states
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editMessageText, setEditMessageText] = useState("");
  const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);

  // React Query mutations
  const { sendText: sendTextMutation } = useSendMessage();
  const { sendMedia: sendMediaMutation } = useSendMedia();
  const { sendAudio: sendAudioMutation } = useSendAudio();
  const { sendReaction, deleteMessage, updateMessage, changeBotStatus, handleLabel } = useChatActions();

  const { data: chat } = useFindChat({
    remoteJid,
    instanceName: instance?.name,
  });

  const { data: messages, isSuccess } = useFindMessages({
    remoteJid,
    instanceName: instance?.name,
  });

  // Sync chat labels
  useEffect(() => {
    if (chat?.labels && Array.isArray(chat.labels)) {
      setChatLabels(chat.labels);
    }
  }, [chat?.labels]);

  // Load available labels for instance
  const loadLabels = async () => {
    if (!instance?.name) return;
    try {
      const labels = await fetchLabels({ instanceName: instance.name, token: instance.token });
      setAvailableLabels(labels);
    } catch (e) {
      console.warn("Failed to load labels:", e);
    }
  };

  useEffect(() => {
    loadLabels();
  }, [instance?.name]);

  // Toggle label on current chat
  const toggleLabel = async (label: LabelItem) => {
    if (!instance?.name || !remoteJid) return;
    const isAssigned = chatLabels.includes(label.name) || chatLabels.includes(label.id);
    const action = isAssigned ? "remove" : "add";

    try {
      await handleLabel({
        instanceName: instance.name,
        token: instance.token,
        number: remoteJid,
        labelId: label.id,
        action,
      });

      setChatLabels((prev) =>
        isAssigned
          ? prev.filter((l) => l !== label.name && l !== label.id)
          : [...prev, label.name || label.id],
      );
    } catch (err) {
      console.error("Error toggling label:", err);
    }
  };

  // Toggle bot status (Human takeover)
  const toggleBot = async () => {
    if (!instance?.name || !remoteJid) return;
    const nextStatus = isBotPaused ? "opened" : "paused";

    try {
      await changeBotStatus({
        instanceName: instance.name,
        token: instance.token,
        remoteJid,
        status: nextStatus,
      });
      setIsBotPaused(!isBotPaused);
    } catch (err) {
      console.error("Error changing bot status:", err);
    }
  };

  // Combine React Query messages with real-time updates
  const allMessages = useMemo(() => {
    if (!messages) return realtimeMessages;

    const messageMap = new Map<string, Message>();
    messages.forEach((m) => messageMap.set(m.key.id, m));
    realtimeMessages.forEach((m) => messageMap.set(m.key.id, m));

    return Array.from(messageMap.values());
  }, [messages, realtimeMessages]);

  // Handle reaction send
  const handleSendReaction = async (targetMessage: Message, emoji: string) => {
    if (!instance?.name || !targetMessage.key) return;

    // Check if user already reacted with this emoji (toggle off)
    const existingReactions = (targetMessage as any).reactions || [];
    const hasSame = existingReactions.some((r: any) => r.text === emoji && r.fromMe);
    const reactionToSend = hasSame ? "" : emoji;

    try {
      // Optimistic update
      setRealtimeMessages((prev) =>
        prev.map((m) => {
          if (m.key.id === targetMessage.key.id) {
            const current = (m as any).reactions || [];
            const filtered = current.filter((r: any) => !r.fromMe);
            const nextReactions = reactionToSend
              ? [...filtered, { text: reactionToSend, fromMe: true, sender: "Você" }]
              : filtered;
            return { ...m, reactions: nextReactions };
          }
          return m;
        }),
      );

      await sendReaction({
        instanceName: instance.name,
        token: instance.token,
        key: targetMessage.key,
        reaction: reactionToSend,
      });
    } catch (err) {
      console.error("Error sending reaction:", err);
    }
  };

  // Handle Edit Message Submit
  const handleEditSubmit = async () => {
    if (!editingMessage || !editMessageText.trim() || !instance?.name || !remoteJid) return;

    try {
      await updateMessage({
        instanceName: instance.name,
        token: instance.token,
        number: remoteJid,
        key: editingMessage.key,
        text: editMessageText.trim(),
      });

      // Optimistically update message
      setRealtimeMessages((prev) =>
        prev.map((m) => {
          if (m.key.id === editingMessage.key.id) {
            return {
              ...m,
              message: { conversation: editMessageText.trim() },
              isEdited: true,
            };
          }
          return m;
        }),
      );

      setEditingMessage(null);
      setEditMessageText("");
    } catch (err) {
      console.error("Error editing message:", err);
    }
  };

  // Handle Delete for Everyone Submit
  const handleDeleteSubmit = async () => {
    if (!deletingMessage || !instance?.name || !remoteJid) return;

    try {
      await deleteMessage({
        instanceName: instance.name,
        token: instance.token,
        id: deletingMessage.key.id,
        remoteJid: deletingMessage.key.remoteJid || remoteJid,
        fromMe: true,
        participant: deletingMessage.key.participant,
      });

      // Optimistically mark as revoked
      setRealtimeMessages((prev) =>
        prev.map((m) => {
          if (m.key.id === deletingMessage.key.id) {
            return {
              ...m,
              isRevoked: true,
              message: { conversation: "Esta mensagem foi apagada" },
            };
          }
          return m;
        }),
      );

      setDeletingMessage(null);
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  // Audio PTT Voice Recorder Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      if (instance?.name && remoteJid) {
        sendPresence({
          instanceName: instance.name,
          token: instance.token,
          number: remoteJid,
          presence: "recording",
        });
      }
    } catch (err) {
      console.error("Microphone access error:", err);
      alert(t("chat.audio.micPermissionError", { defaultValue: "Não foi possível acessar o microfone." }));
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];

    if (instance?.name && remoteJid) {
      sendPresence({
        instanceName: instance.name,
        token: instance.token,
        number: remoteJid,
        presence: "paused",
      });
    }
  };

  const stopAndSendRecording = async () => {
    if (!mediaRecorderRef.current || !instance?.name || !instance?.token || !remoteJid) return;

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" });
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(",")[1];
        try {
          setIsSending(true);
          await sendAudioMutation({
            instanceName: instance.name,
            token: instance.token,
            data: {
              number: remoteJid,
              audio: base64Audio,
              audioMessage: { audio: base64Audio },
              quoted: replyingTo ? { key: replyingTo.key, message: replyingTo.message } : undefined,
              encoding: true,
            },
          });
          setReplyingTo(null);
        } catch (error) {
          console.error("Error sending voice recording:", error);
        } finally {
          setIsSending(false);
          setIsRecording(false);
          setRecordingDuration(0);
          audioChunksRef.current = [];
        }
      };
    };

    mediaRecorderRef.current.stop();
    sendPresence({
      instanceName: instance.name,
      token: instance.token,
      number: remoteJid,
      presence: "paused",
    });
  };

  // Handle sending text messages with quoted reply
  const sendTextMessage = async () => {
    if (!messageText.trim() || !remoteJid || !instance?.name || !instance?.token || isSending) return;

    try {
      setIsSending(true);
      const payload: any = {
        number: remoteJid,
        text: messageText.trim(),
      };

      if (replyingTo) {
        payload.quoted = {
          key: replyingTo.key,
          message: replyingTo.message,
        };
      }

      await sendTextMutation({
        instanceName: instance.name,
        token: instance.token,
        data: payload,
      });

      setMessageText("");
      setReplyingTo(null);
      if (textareaRef.current) {
        textareaRef.current.value = "";
        handleTextareaChange();
      }

      sendPresence({
        instanceName: instance.name,
        token: instance.token,
        number: remoteJid,
        presence: "paused",
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle sending media messages with quoted reply
  const sendMediaMessage = async () => {
    if (!selectedMedia || !remoteJid || !instance?.name || !instance?.token || isSending) return;

    try {
      setIsSending(true);

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(selectedMedia);
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve(base64.split(",")[1]);
        };
        reader.onerror = reject;
      });

      const mediaPayload: any = {
        number: remoteJid,
        mediaMessage: {
          mediatype:
            selectedMedia.type.split("/")[0] === "application"
              ? "document"
              : (selectedMedia.type.split("/")[0] as "audio" | "video" | "image" | "document"),
          mimetype: selectedMedia.type,
          caption: messageText.trim(),
          media: base64Data,
          fileName: selectedMedia.name,
        },
      };

      if (replyingTo) {
        mediaPayload.quoted = {
          key: replyingTo.key,
          message: replyingTo.message,
        };
      }

      await sendMediaMutation({
        instanceName: instance.name,
        token: instance.token,
        data: mediaPayload,
      });

      setSelectedMedia(null);
      setMessageText("");
      setReplyingTo(null);
      if (textareaRef.current) {
        textareaRef.current.value = "";
        handleTextareaChange();
      }
    } catch (error) {
      console.error("Error sending media:", error);
    } finally {
      setIsSending(false);
    }
  };

  const sendMessage = async () => {
    if (selectedMedia) {
      await sendMediaMessage();
    } else {
      await sendTextMessage();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMessageText(text);
    handleTextareaChange();

    if (!instance?.name || !remoteJid) return;

    if (text.trim().length > 0) {
      const now = Date.now();
      if (now - lastPresenceSentRef.current > 3000) {
        lastPresenceSentRef.current = now;
        sendPresence({
          instanceName: instance.name,
          token: instance.token,
          number: remoteJid,
          presence: "composing",
          delay: 1500,
        });
      }
    }
  };

  // WebSocket for Realtime messages, reactions, status and presence
  useEffect(() => {
    if (!instance?.name || !remoteJid) return;

    const serverUrl = getToken(TOKEN_ID.API_URL);
    if (!serverUrl) return;

    const socket = connectSocket(serverUrl);

    const updateMessagesFromWebsocket = (_eventType: string, data: any) => {
      if (!instance || data.instance !== instance.name) return;

      const incomingMsg = data?.data;
      if (!incomingMsg?.key) return;

      // Handle reaction message
      if (incomingMsg.message?.reactionMessage) {
        const targetKey = incomingMsg.message.reactionMessage.key;
        const emoji = incomingMsg.message.reactionMessage.text;

        setRealtimeMessages((prev) =>
          prev.map((msg) => {
            if (msg.key.id === targetKey.id) {
              const currentReactions = (msg as any).reactions || [];
              const sender = incomingMsg.pushName || (incomingMsg.key.fromMe ? "Você" : "Contato");
              const filtered = currentReactions.filter(
                (r: any) => !(r.sender === sender || (incomingMsg.key.fromMe && r.fromMe)),
              );

              const nextReactions = emoji
                ? [...filtered, { text: emoji, sender, fromMe: incomingMsg.key.fromMe }]
                : filtered;

              return { ...msg, reactions: nextReactions };
            }
            return msg;
          }),
        );
        return;
      }

      // Check if message belongs to current chat
      if (incomingMsg.key.remoteJid !== remoteJid && incomingMsg.key.remoteJidAlt !== remoteJid) {
        return;
      }

      setRealtimeMessages((prevMessages) => {
        const existingIndex = prevMessages.findIndex((msg) => msg.key.id === incomingMsg.key.id);
        if (existingIndex !== -1) {
          const updatedMessages = [...prevMessages];
          updatedMessages[existingIndex] = { ...updatedMessages[existingIndex], ...incomingMsg };
          return updatedMessages;
        } else {
          return [...prevMessages, incomingMsg];
        }
      });
    };

    const updateMessageStatus = (data: any) => {
      if (!instance || data.instance !== instance.name) return;
      const updateData = data?.data;

      if (Array.isArray(updateData)) {
        updateData.forEach((item) => {
          if (item?.key?.id && item?.update?.status) {
            setRealtimeMessages((prev) =>
              prev.map((msg) =>
                msg.key.id === item.key.id ? { ...msg, status: item.update.status } : msg,
              ),
            );
          }
        });
      } else if (updateData?.key?.id && updateData?.status) {
        setRealtimeMessages((prev) =>
          prev.map((msg) =>
            msg.key.id === updateData.key.id ? { ...msg, status: updateData.status } : msg,
          ),
        );
      }
    };

    // Presence updates listener
    const handlePresence = (data: any) => {
      if (!instance || data.instance !== instance.name) return;

      const jid = data?.data?.id;
      if (jid !== remoteJid && data?.data?.key?.remoteJid !== remoteJid && data?.data?.key?.remoteJidAlt !== remoteJid) {
        return;
      }

      const presences = data?.data?.presences;
      let status: string | null = null;

      if (presences && typeof presences === "object") {
        const firstKey = Object.keys(presences)[0];
        status = presences[firstKey]?.lastKnownPresence;
      } else if (data?.data?.presence) {
        status = data?.data?.presence;
      }

      if (status === "composing" || status === "recording") {
        setContactPresence(status);
        if (presenceTimeoutRef.current) clearTimeout(presenceTimeoutRef.current);
        presenceTimeoutRef.current = setTimeout(() => {
          setContactPresence(null);
        }, 4500);
      } else if (status === "paused" || status === "available" || status === "unavailable") {
        setContactPresence(null);
      }
    };

    socket.on("messages.upsert", (data: any) => updateMessagesFromWebsocket("messages.upsert", data));
    socket.on("send.message", (data: any) => updateMessagesFromWebsocket("send.message", data));
    socket.on("messages.update", updateMessageStatus);
    socket.on("presence.update", handlePresence);

    socket.connect();

    return () => {
      socket.off("messages.upsert");
      socket.off("send.message");
      socket.off("messages.update");
      socket.off("presence.update");
      if (presenceTimeoutRef.current) clearTimeout(presenceTimeoutRef.current);
      disconnectSocket(socket);
    };
  }, [instance?.name, remoteJid]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    if (!allMessages) return [];

    const sortedMessages = [...allMessages].sort((a, b) => {
      const aTime = getMessageTimestamp(a).getTime();
      const bTime = getMessageTimestamp(b).getTime();
      return aTime - bTime;
    });

    const grouped: { date: string; messages: Message[] }[] = [];
    let currentDate = "";
    let currentGroup: Message[] = [];

    sortedMessages.forEach((message) => {
      const messageDate = getMessageTimestamp(message);
      const dateString = messageDate.toDateString();

      if (dateString !== currentDate) {
        if (currentGroup.length > 0) {
          grouped.push({
            date: formatDateSeparator(new Date(currentDate), t, locale),
            messages: currentGroup,
          });
        }
        currentDate = dateString;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      grouped.push({
        date: formatDateSeparator(new Date(currentDate), t, locale),
        messages: currentGroup,
      });
    }

    return grouped;
  }, [allMessages, t, locale]);

  useEffect(() => {
    if (isSuccess && allMessages) {
      scrollToBottom();
    }
  }, [isSuccess, allMessages, scrollToBottom]);

  // Clear state on chat switch
  useEffect(() => {
    setSelectedMedia(null);
    setMessageText("");
    setReplyingTo(null);
    setRealtimeMessages([]);
    cancelRecording();
    if (textareaRef.current) {
      textareaRef.current.value = "";
      handleTextareaChange();
    }
  }, [remoteJid]);

  const scrollToMessage = (stanzaId?: string) => {
    if (!stanzaId) return;
    const el = document.getElementById(`msg-${stanzaId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-primary/20");
      setTimeout(() => el.classList.remove("bg-primary/20"), 1200);
    }
  };

  const renderStatusIcon = (message: Message) => {
    const status = message.status;
    if (status === 4 || status === 5 || status === "READ") {
      return (
        <span title="Lida">
          <CheckCheck className="h-3 w-3 text-sky-400" />
        </span>
      );
    }
    if (status === 3 || status === "DELIVERY_ACK") {
      return (
        <span title="Entregue">
          <CheckCheck className="h-3 w-3 text-muted-foreground" />
        </span>
      );
    }
    if (status === 2 || status === "SERVER_ACK") {
      return (
        <span title="Enviada">
          <Check className="h-3 w-3 text-muted-foreground" />
        </span>
      );
    }
    return (
      <span title="Pendente">
        <Clock className="h-3 w-3 text-muted-foreground" />
      </span>
    );
  };

  const renderMessageBubble = (message: Message) => {
    const isFromMe = !!message.key.fromMe;
    const isGroup = !!remoteJid?.endsWith("@g.us");
    const participant = message.key.participant;
    const senderKey = participant || message.pushName || "";
    const senderName = message.pushName || (participant ? participant.split("@")[0] : "");
    const quoted = getQuotedInfo(message);
    const reactions = (message as any).reactions || [];
    const isTextMessage =
      message.messageType === "conversation" || message.messageType === "extendedTextMessage";

    return (
      <div
        key={message.key.id || message.id}
        id={`msg-${message.key.id}`}
        className={`group relative mb-4 flex transition-colors duration-300 ${
          isFromMe ? "justify-end" : "justify-start"
        }`}
      >
        {/* Floating Quick Action Bar on Hover */}
        <div
          className={`absolute -top-7 z-10 hidden items-center gap-1 rounded-full border border-border/60 bg-background/95 px-2 py-0.5 shadow-md backdrop-blur-xs group-hover:flex ${
            isFromMe ? "right-2" : "left-2"
          }`}
        >
          {/* Quick Reaction Emojis */}
          <div className="flex items-center gap-0.5 border-r border-border/60 pr-1">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSendReaction(message, emoji)}
                className="rounded-full p-1 text-xs transition-transform hover:scale-125"
                title={`Reagir ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setReplyingTo(message)}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            title="Responder"
          >
            <Reply className="h-3.5 w-3.5" />
          </Button>

          {/* Edit Button (Only for own text messages) */}
          {isFromMe && isTextMessage && !(message as any).isRevoked && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingMessage(message);
                setEditMessageText(getMessageText(message.message));
              }}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Editar mensagem"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}

          {/* Delete for Everyone (Only for own messages) */}
          {isFromMe && !(message as any).isRevoked && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setDeletingMessage(message)}
              className="h-6 w-6 text-destructive hover:bg-destructive/10"
              title="Apagar para todos"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Message Bubble Container */}
        <div className="relative max-w-[75%] sm:max-w-[70%]">
          {/* Group Sender Name */}
          {!isFromMe && isGroup && senderName && (
            <div
              className="mb-1 text-xs font-semibold"
              style={{ color: getSenderColor(senderKey) }}
            >
              {senderName}
            </div>
          )}

          {/* Bubble Box */}
          <div
            className={`rounded-lg px-3 py-2 text-sm shadow-xs ${
              isFromMe
                ? "bg-primary text-primary-foreground"
                : "border border-border/60 bg-muted text-foreground"
            }`}
          >
            {/* Quoted Message Card */}
            <QuotedBubble quoted={quoted} isFromMe={isFromMe} onQuoteClick={scrollToMessage} />

            {/* Content Body */}
            <MessageContent message={message} />
          </div>

          {/* Reaction Pills on Bubble */}
          {reactions.length > 0 && (
            <div
              className={`absolute -bottom-2 flex cursor-pointer items-center gap-1 rounded-full border border-border/70 bg-background px-1.5 py-0.5 text-xs shadow-xs ${
                isFromMe ? "right-2" : "left-2"
              }`}
            >
              {reactions.map((r: any, idx: number) => (
                <span key={idx} title={r.sender}>
                  {r.text}
                </span>
              ))}
            </div>
          )}

          {/* Footer: Time + Edited Badge + Status Tick */}
          <div
            className={`mt-0.5 flex items-center gap-1 px-1 text-[11px] text-muted-foreground ${
              isFromMe ? "justify-end" : "justify-start"
            }`}
          >
            {(message as any).isEdited && <span className="text-[10px] italic">(editada)</span>}
            <span>{formatMessageTime(getMessageTimestamp(message), locale)}</span>
            {isFromMe && renderStatusIcon(message)}
          </div>
        </div>
      </div>
    );
  };

  const headerName = chat?.pushName || chat?.remoteJid?.split("@")[0];
  const headerSub = chat?.remoteJid?.split("@")[0];

  return (
    <div className="flex h-full flex-col bg-muted/10">
      {/* Upgraded Header with Typing Status, Bot Switch, and Labels */}
      <div className="flex-shrink-0 border-b border-border/60 bg-background/95 p-3.5 backdrop-blur-sm sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={chat?.profilePicUrl} alt={headerName} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="truncate font-semibold leading-tight">{headerName}</h3>
              {contactPresence === "composing" ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 animate-pulse">
                  digitando...
                </span>
              ) : contactPresence === "recording" ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 animate-pulse">
                  gravando áudio...
                </span>
              ) : (
                <p className="truncate text-xs text-muted-foreground">{headerSub}</p>
              )}

              {/* Active Labels Badges */}
              {chatLabels.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {chatLabels.map((lbl, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="border-primary/20 bg-primary/10 px-1.5 py-0 text-[10px] font-medium text-primary"
                    >
                      {lbl}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Header Action Buttons: Bot Switch & Labels */}
          <div className="flex items-center gap-2">
            {/* Bot Status Toggle (Human Takeover) */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleBot}
              className={`h-8 gap-1.5 px-2.5 text-xs transition-colors ${
                isBotPaused
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
              }`}
              title="Alternar entre Bot automático e Atendimento Humano"
            >
              {isBotPaused ? (
                <>
                  <BotOff className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Humano (Bot Pausado)</span>
                </>
              ) : (
                <>
                  <Bot className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Bot Ativo</span>
                </>
              )}
            </Button>

            {/* Labels Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs">
                  <Tag className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Etiquetas</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Gerenciar Etiquetas
                </div>
                {availableLabels.length === 0 ? (
                  <div className="p-2 text-xs text-muted-foreground">Nenhuma etiqueta cadastrada</div>
                ) : (
                  availableLabels.map((label) => {
                    const isAssigned =
                      chatLabels.includes(label.name) || chatLabels.includes(label.id);
                    return (
                      <DropdownMenuItem
                        key={label.id}
                        onClick={() => toggleLabel(label)}
                        className="flex cursor-pointer items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: label.color || "#10b981" }}
                          />
                          <span>{label.name}</span>
                        </div>
                        {isAssigned && <span className="text-primary font-bold">✓</span>}
                      </DropdownMenuItem>
                    );
                  })
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Message History Feed */}
      <div className="flex w-full flex-1 flex-col overflow-y-auto px-4 py-4">
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex}>
            <DateSeparator date={group.date} />
            {group.messages.map((message) => renderMessageBubble(message))}
          </div>
        ))}
        <div ref={lastMessageRef as never} />
      </div>

      {/* Input Section */}
      <div className="flex-shrink-0 border-t border-border/60 bg-background p-3">
        <div className="rounded-lg border border-border bg-card shadow-xs">
          {/* Quoted Message Reply Banner */}
          {replyingTo && (
            <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-3 py-1.5 text-xs">
              <div className="flex items-center gap-2 overflow-hidden border-l-4 border-primary pl-2">
                <Reply className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                <div className="min-w-0 overflow-hidden">
                  <p className="truncate font-semibold text-primary">
                    {replyingTo.key.fromMe
                      ? "Você"
                      : replyingTo.pushName ||
                        replyingTo.key.participant?.split("@")[0] ||
                        "Contato"}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {getMessageText(replyingTo.message) || "Mídia / Anexo"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setReplyingTo(null)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Selected Media Banner */}
          {selectedMedia && (
            <div className="border-b border-border bg-muted/30 px-3 py-2">
              <SelectedMedia selectedMedia={selectedMedia} setSelectedMedia={setSelectedMedia} />
            </div>
          )}

          {/* Input Row: Media / Recording / Textarea / Send */}
          <div className="flex items-center gap-2 px-2 py-1.5">
            {isRecording ? (
              /* Voice Recording Bar */
              <div className="flex flex-1 items-center justify-between rounded-lg bg-destructive/10 px-3 py-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-mono font-medium text-destructive">
                    {Math.floor(recordingDuration / 60)}:
                    {(recordingDuration % 60).toString().padStart(2, "0")}
                  </span>
                  <span className="text-xs text-muted-foreground">Gravando mensagem de voz...</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={cancelRecording}
                    className="h-8 w-8 text-destructive hover:bg-destructive/20"
                    title="Cancelar gravação"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    onClick={stopAndSendRecording}
                    className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
                    title="Enviar mensagem de voz"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Standard Input Row */
              <>
                <div className="flex flex-shrink-0 items-center">
                  {instance && <MediaOptions instance={instance} setSelectedMedia={setSelectedMedia} />}
                </div>

                <Textarea
                  placeholder={t("chat.input.placeholder", { defaultValue: "Digite uma mensagem..." })}
                  name="message"
                  id="message"
                  rows={1}
                  ref={textareaRef}
                  value={messageText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={isSending}
                  style={{ height: textareaHeight }}
                  className="min-h-9 flex-1 resize-none border-none bg-transparent px-2 py-1.5 text-sm shadow-none focus-visible:outline-hidden focus-visible:ring-0 focus-visible:ring-offset-0"
                />

                {/* Show Mic button if text and selected media are empty, else show Send */}
                {!messageText.trim() && !selectedMedia ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={startRecording}
                    className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-primary"
                    title="Gravar áudio de voz (PTT)"
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="icon"
                    onClick={sendMessage}
                    disabled={isSending}
                    className="h-9 w-9 flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/85 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">{t("chat.input.send")}</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Message Dialog */}
      <Dialog open={!!editingMessage} onOpenChange={(open) => !open && setEditingMessage(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Mensagem</DialogTitle>
            <DialogDescription>
              Edite o texto da sua mensagem. Ela será atualizada para todos os participantes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              value={editMessageText}
              onChange={(e) => setEditMessageText(e.target.value)}
              rows={3}
              className="resize-none"
              placeholder="Digite o novo texto..."
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingMessage(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSubmit} disabled={!editMessageText.trim()}>
              Salvar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete for Everyone Dialog */}
      <Dialog open={!!deletingMessage} onOpenChange={(open) => !open && setDeletingMessage(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apagar Mensagem para Todos?</DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja apagar esta mensagem para todos os participantes da conversa?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeletingMessage(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmit}>
              Apagar para Todos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { Messages };
