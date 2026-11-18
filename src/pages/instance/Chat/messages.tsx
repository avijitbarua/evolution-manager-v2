import { RefObject, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { useInstance } from "@/contexts/InstanceContext";
import {
  fetchLabels,
  LabelItem,
  useChatActions,
} from "@/lib/queries/chat/chatActions";
import { useFindChat } from "@/lib/queries/chat/findChat";
import { useFindMessages } from "@/lib/queries/chat/findMessages";
import {
  useSendAudio,
  useSendMedia,
  useSendMessage,
} from "@/lib/queries/chat/sendMessage";
import { Message } from "@/types/evolution.types";

import { ChatHeader } from "./components/ChatHeader";
import { ChatInputBar } from "./components/ChatInputBar";
import { DeleteMessageModal } from "./components/DeleteMessageModal";
import { EditMessageModal } from "./components/EditMessageModal";
import { MessageList } from "./components/MessageList";
import { useChatPresence } from "./hooks/useChatPresence";
import { useChatReadReceipts } from "./hooks/useChatReadReceipts";
import { useChatSocket } from "./hooks/useChatSocket";
import { useVoiceRecorder } from "./hooks/useVoiceRecorder";

type MessagesProps = {
  textareaRef: RefObject<HTMLTextAreaElement>;
  handleTextareaChange: () => void;
  textareaHeight: string;
  lastMessageRef: RefObject<HTMLDivElement>;
  scrollToBottom: () => void;
};

function Messages({
  textareaRef,
  handleTextareaChange,
  textareaHeight,
  lastMessageRef,
  scrollToBottom,
}: MessagesProps) {
  const { instance } = useInstance();
  const { remoteJid } = useParams<{ remoteJid: string }>();

  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Bot & Labels State
  const [isBotPaused, setIsBotPaused] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<LabelItem[]>([]);
  const [chatLabels, setChatLabels] = useState<string[]>([]);

  // Modals State
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);

  // API Queries & Mutations
  const { sendText: sendTextMutation } = useSendMessage();
  const { sendMedia: sendMediaMutation } = useSendMedia();
  const { sendAudio: sendAudioMutation } = useSendAudio();
  const {
    sendReaction,
    deleteMessage,
    updateMessage,
    changeBotStatus,
    handleLabel,
  } = useChatActions();

  const { data: chat } = useFindChat({
    remoteJid,
    instanceName: instance?.name,
  });

  const { data: messages, isSuccess } = useFindMessages({
    remoteJid,
    instanceName: instance?.name,
  });

  // Combine query messages with realtime updates
  const allMessages = useMemo(() => {
    if (!messages) return realtimeMessages;

    const messageMap = new Map<string, Message>();
    messages.forEach((m) => messageMap.set(m.key.id, m));
    realtimeMessages.forEach((m) => messageMap.set(m.key.id, m));

    return Array.from(messageMap.values());
  }, [messages, realtimeMessages]);

  // Hook 1: Presence (Composing / Recording)
  const { contactPresence, notifyTyping, notifyPaused } = useChatPresence({
    instanceName: instance?.name,
    instanceToken: instance?.token,
    remoteJid,
  });

  // Hook 2: Socket (Messages upsert, reactions, status updates, revokes)
  useChatSocket({
    instanceName: instance?.name,
    remoteJid,
    setRealtimeMessages,
  });

  // Hook 3: Read Receipts (WhatsApp Web seen / mark as read)
  useChatReadReceipts({
    instanceName: instance?.name,
    instanceToken: instance?.token,
    remoteJid,
    messages: allMessages,
  });

  // Sync Chat Labels from query
  useEffect(() => {
    if (chat?.labels && Array.isArray(chat.labels)) {
      setChatLabels(chat.labels);
    }
  }, [chat?.labels]);

  // Fetch Available Labels
  useEffect(() => {
    if (!instance?.name) return;
    fetchLabels({ instanceName: instance.name, token: instance.token })
      .then(setAvailableLabels)
      .catch((e) => console.warn("Failed to load labels:", e));
  }, [instance?.name, instance?.token]);

  // Scroll to bottom on load / message arrival
  useEffect(() => {
    if (isSuccess && allMessages.length > 0) {
      scrollToBottom();
    }
  }, [isSuccess, allMessages.length, scrollToBottom]);

  // Reset state when switching chats
  useEffect(() => {
    setSelectedMedia(null);
    setMessageText("");
    setReplyingTo(null);
    setRealtimeMessages([]);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      handleTextareaChange();
    }
  }, [remoteJid, handleTextareaChange, textareaRef]);

  // Send Voice Note Handler
  const handleSendAudio = async (base64Audio: string) => {
    if (!instance?.name || !instance?.token || !remoteJid) return;

    try {
      setIsSending(true);
      await sendAudioMutation({
        instanceName: instance.name,
        token: instance.token,
        data: {
          number: remoteJid,
          audio: base64Audio,
          audioMessage: { audio: base64Audio },
          quoted: replyingTo
            ? { key: replyingTo.key, message: replyingTo.message }
            : undefined,
          encoding: true,
        },
      });
      setReplyingTo(null);
    } finally {
      setIsSending(false);
    }
  };

  // Hook 4: Voice Recorder
  const {
    isRecording,
    recordingDuration,
    startRecording,
    cancelRecording,
    stopAndSendRecording,
  } = useVoiceRecorder({
    instanceName: instance?.name,
    instanceToken: instance?.token,
    remoteJid,
    onSendAudio: handleSendAudio,
  });

  // Send Text Message
  const sendTextMessage = async () => {
    if (!messageText.trim() || !remoteJid || !instance?.name || !instance?.token || isSending)
      return;

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
      notifyPaused();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Send Media Message
  const sendMediaMessage = async () => {
    if (!selectedMedia || !remoteJid || !instance?.name || !instance?.token || isSending)
      return;

    try {
      setIsSending(true);
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(selectedMedia);
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
      });

      const mediaPayload: any = {
        number: remoteJid,
        mediaMessage: {
          mediatype:
            selectedMedia.type.split("/")[0] === "application"
              ? "document"
              : (selectedMedia.type.split("/")[0] as
                  | "audio"
                  | "video"
                  | "image"
                  | "document"),
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

  const handleSendMessage = () => {
    if (selectedMedia) {
      sendMediaMessage();
    } else {
      sendTextMessage();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMessageText(text);
    handleTextareaChange();
    notifyTyping(text);
  };

  // Reactions Handler
  const handleSendReaction = async (targetMessage: Message, emoji: string) => {
    if (!instance?.name || !targetMessage.key) return;

    const existing = (targetMessage as any).reactions || [];
    const hasSame = existing.some((r: any) => r.text === emoji && r.fromMe);
    const reactionToSend = hasSame ? "" : emoji;

    // Optimistic UI Update
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

    try {
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

  // Edit Message Handler
  const handleSaveEdit = async (message: Message, newText: string) => {
    if (!instance?.name || !remoteJid) return;

    await updateMessage({
      instanceName: instance.name,
      token: instance.token,
      number: remoteJid,
      key: message.key,
      text: newText,
    });

    setRealtimeMessages((prev) =>
      prev.map((m) =>
        m.key.id === message.key.id
          ? {
              ...m,
              message: { conversation: newText },
              isEdited: true,
            }
          : m,
      ),
    );
  };

  // Delete for Everyone Handler
  const handleConfirmDelete = async (message: Message) => {
    if (!instance?.name || !remoteJid) return;

    await deleteMessage({
      instanceName: instance.name,
      token: instance.token,
      id: message.key.id,
      remoteJid: message.key.remoteJid || remoteJid,
      fromMe: true,
      participant: message.key.participant,
    });

    setRealtimeMessages((prev) =>
      prev.map((m) =>
        m.key.id === message.key.id
          ? {
              ...m,
              isRevoked: true,
              message: { conversation: "Esta mensagem foi apagada" },
            }
          : m,
      ),
    );
  };

  // Toggle Bot Status
  const handleToggleBot = async () => {
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

  // Toggle Label on Chat
  const handleToggleLabel = async (label: LabelItem) => {
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

  return (
    <div className="flex h-full flex-col bg-muted/10">
      {/* Modular Header */}
      <ChatHeader
        chat={chat}
        remoteJid={remoteJid || ""}
        contactPresence={contactPresence}
        isBotPaused={isBotPaused}
        onToggleBot={handleToggleBot}
        availableLabels={availableLabels}
        chatLabels={chatLabels}
        onToggleLabel={handleToggleLabel}
      />

      {/* Modular Message Stream */}
      <MessageList
        messages={allMessages}
        remoteJid={remoteJid || ""}
        lastMessageRef={lastMessageRef}
        onReact={handleSendReaction}
        onReply={(msg) => setReplyingTo(msg)}
        onEdit={(msg) => setEditingMessage(msg)}
        onDelete={(msg) => setDeletingMessage(msg)}
      />

      {/* Modular Input Bar */}
      <ChatInputBar
        instance={instance}
        messageText={messageText}
        textareaRef={textareaRef}
        textareaHeight={textareaHeight}
        isSending={isSending}
        selectedMedia={selectedMedia}
        replyingTo={replyingTo}
        isRecording={isRecording}
        recordingDuration={recordingDuration}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onSendMessage={handleSendMessage}
        onCancelReply={() => setReplyingTo(null)}
        setSelectedMedia={setSelectedMedia}
        onStartRecording={startRecording}
        onCancelRecording={cancelRecording}
        onStopAndSendRecording={stopAndSendRecording}
      />

      {/* Localized Edit Message Modal (with 15 min limit) */}
      <EditMessageModal
        message={editingMessage}
        isOpen={!!editingMessage}
        onClose={() => setEditingMessage(null)}
        onSave={handleSaveEdit}
      />

      {/* Localized Delete Message Modal */}
      <DeleteMessageModal
        message={deletingMessage}
        isOpen={!!deletingMessage}
        onClose={() => setDeletingMessage(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export { Messages };
