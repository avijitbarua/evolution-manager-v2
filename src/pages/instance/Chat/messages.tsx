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
import { isMessageEdited, isMessageRevoked } from "./utils/messageRules";

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

  // Canonical Single State for Chat Messages
  const [messageList, setMessageList] = useState<Message[]>([]);

  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Bot & Labels State
  const [isBotPaused, setIsBotPaused] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<LabelItem[]>([]);
  const [chatLabels, setChatLabels] = useState<string[]>([]);

  // Modals State
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);

  // API Mutations
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

  const { data: queryMessages, isLoading: isMessagesLoading, isSuccess } = useFindMessages({
    remoteJid,
    instanceName: instance?.name,
  });

  // Safely extract message records from any response structure
  const serverMessages = useMemo(() => {
    if (!queryMessages) return [];
    if (Array.isArray(queryMessages)) return queryMessages;
    if (Array.isArray((queryMessages as any)?.messages?.records))
      return (queryMessages as any).messages.records;
    if (Array.isArray((queryMessages as any)?.records))
      return (queryMessages as any).records;
    if (Array.isArray((queryMessages as any)?.messages))
      return (queryMessages as any).messages;
    return [];
  }, [queryMessages]);

  // Sync React Query messages into canonical messageList without race conditions
  useEffect(() => {
    if (!remoteJid) {
      setMessageList([]);
      return;
    }

    setMessageList((prev) => {
      const map = new Map<string, Message>();

      // 1. First populate with server messages for this remoteJid
      serverMessages.forEach((m: Message) => {
        const id = m.key?.id || m.id;
        if (id) map.set(id, m);
      });

      // 2. Only retain previous messages that belong to THIS remoteJid
      const cleanTarget = remoteJid.split("@")[0];
      prev.forEach((m: Message) => {
        const msgJid = m.key?.remoteJid || (m as any).remoteJid || "";
        const matches =
          !msgJid ||
          msgJid === remoteJid ||
          msgJid.startsWith(cleanTarget) ||
          (m.key?.id && m.key.id.startsWith("temp-"));

        if (!matches) return; // Drop messages from other chats!

        const id = m.key?.id || m.id;
        if (!id) return;

        const serverMsg = map.get(id);
        if (serverMsg) {
          const anyM = m as any;
          const anyServer = serverMsg as any;
          map.set(id, {
            ...serverMsg,
            ...m,
            message: anyM.isEdited ? m.message : serverMsg.message,
            status:
              m.status !== undefined && m.status !== "PENDING" && m.status !== 1
                ? m.status
                : serverMsg.status,
            isEdited: anyM.isEdited || isMessageEdited(serverMsg),
            isRevoked: anyM.isRevoked || isMessageRevoked(serverMsg),
            reactions: anyM.reactions?.length ? anyM.reactions : anyServer.reactions,
          } as Message);
        } else {
          // Keep locally added messages (e.g. optimistic or newly received via socket)
          map.set(id, m);
        }
      });

      return Array.from(map.values());
    });
  }, [remoteJid, serverMessages]);

  // Hook 1: Real-time Presence
  const { contactPresence, notifyTyping, notifyPaused } = useChatPresence({
    instanceName: instance?.name,
    instanceToken: instance?.token,
    remoteJid,
  });

  // Hook 2: Socket with instant messageList updates (status, upsert, edit, delete, reactions)
  useChatSocket({
    instanceName: instance?.name,
    remoteJid,
    setMessageList,
  });

  // Hook 3: WhatsApp Web Read Receipts (Seen / Mark as Read)
  useChatReadReceipts({
    instanceName: instance?.name,
    instanceToken: instance?.token,
    remoteJid,
    messages: messageList,
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

  // Auto-scroll on initial load or new messages
  useEffect(() => {
    if (isSuccess && messageList.length > 0) {
      scrollToBottom();
    }
  }, [isSuccess, messageList.length, scrollToBottom]);

  // Reset chat input state on chat switch
  useEffect(() => {
    setSelectedMedia(null);
    setMessageText("");
    setReplyingTo(null);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      handleTextareaChange();
    }
  }, [remoteJid, handleTextareaChange, textareaRef]);

  // Send Voice Note Handler
  const handleSendAudio = async (base64Audio: string) => {
    if (!instance?.name || !instance?.token || !remoteJid) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticAudio: Message = {
      id: tempId,
      key: {
        id: tempId,
        fromMe: true,
        remoteJid,
      },
      pushName: "Você",
      messageType: "audioMessage",
      message: {
        audioMessage: {
          audio: base64Audio,
        },
        base64: base64Audio,
      },
      messageTimestamp: String(Math.floor(Date.now() / 1000)),
      instanceId: instance.id || "",
      source: "web",
      status: 1, // Pending (Clock)
    };

    setMessageList((prev) => [...prev, optimisticAudio]);

    try {
      setIsSending(true);
      const res = await sendAudioMutation({
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

      const realMsg = res?.data || res;
      const realId = realMsg?.key?.id;
      if (realId) {
        setMessageList((prev) => {
          const socketAlreadyAdded = prev.some(
            (m) => (m.key?.id || m.id) === realId && m.key?.id !== tempId && m.id !== tempId,
          );
          if (socketAlreadyAdded) {
            return prev.filter((m) => m.key?.id !== tempId && m.id !== tempId);
          }
          return prev.map((m) =>
            m.key?.id === tempId || m.id === tempId
              ? {
                  ...m,
                  id: realMsg.id || realId,
                  key: realMsg.key,
                  status: realMsg.status || 2, // Sent (Single check ✓)
                }
              : m,
          );
        });
      }
      setReplyingTo(null);
    } catch (error) {
      console.error("Error sending voice note:", error);
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

  // Send Text Message Handler with Instant Optimistic UI
  const sendTextMessage = async () => {
    const textToSend = messageText.trim();
    if (!textToSend || !remoteJid || !instance?.name || !instance?.token || isSending)
      return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      key: {
        id: tempId,
        fromMe: true,
        remoteJid,
      },
      pushName: "Você",
      messageType: "conversation",
      message: {
        conversation: textToSend,
        contextInfo: replyingTo
          ? {
              participant: replyingTo.key?.participant || (replyingTo.key?.fromMe ? "Você" : remoteJid),
              stanzaId: replyingTo.key?.id,
              quotedMessage: replyingTo.message,
            }
          : undefined,
      },
      messageTimestamp: String(Math.floor(Date.now() / 1000)),
      instanceId: instance.id || "",
      source: "web",
      status: 1, // Pending (Clock 🕒)
    };

    // Instant UI insertion
    setMessageList((prev) => [...prev, optimisticMsg]);
    setMessageText("");
    const quotedToSend = replyingTo;
    setReplyingTo(null);

    if (textareaRef.current) {
      textareaRef.current.value = "";
      handleTextareaChange();
    }
    notifyPaused();

    try {
      setIsSending(true);
      const payload: any = {
        number: remoteJid,
        text: textToSend,
      };

      if (quotedToSend) {
        payload.quoted = {
          key: quotedToSend.key,
          message: quotedToSend.message,
        };
      }

      const res = await sendTextMutation({
        instanceName: instance.name,
        token: instance.token,
        data: payload,
      });

      // Update from pending clock (1) to sent single check (2) immediately!
      const realMsg = res?.data || res;
      const realId = realMsg?.key?.id;
      if (realId) {
        setMessageList((prev) => {
          const socketAlreadyAdded = prev.some(
            (m) => (m.key?.id || m.id) === realId && m.key?.id !== tempId && m.id !== tempId,
          );
          if (socketAlreadyAdded) {
            return prev.filter((m) => m.key?.id !== tempId && m.id !== tempId);
          }
          return prev.map((m) =>
            m.key?.id === tempId || m.id === tempId
              ? {
                  ...m,
                  id: realMsg.id || realId,
                  key: realMsg.key,
                  status: realMsg.status || 2, // Sent (Single check ✓)
                }
              : m,
          );
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Send Media Message Handler
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

  // Instant Reactions Handler
  const handleSendReaction = async (targetMessage: Message, emoji: string) => {
    if (!instance?.name || !targetMessage.key) return;

    const existing = (targetMessage as any).reactions || [];
    const hasSame = existing.some((r: any) => r.text === emoji && r.fromMe);
    const reactionToSend = hasSame ? "" : emoji;

    // Instant in-memory update
    setMessageList((prev) =>
      prev.map((m) => {
        const mId = m.key?.id || m.id;
        const targetId = targetMessage.key?.id || targetMessage.id;
        if (mId === targetId) {
          const current = (m as any).reactions || [];
          const filtered = current.filter((r: any) => !r.fromMe);
          const next = reactionToSend
            ? [...filtered, { text: reactionToSend, fromMe: true, sender: "Você" }]
            : filtered;
          return { ...m, reactions: next };
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

  // Instant Edit Message Handler (Updates UI Immediately + Shows Edited tag!)
  const handleSaveEdit = async (message: Message, newText: string) => {
    if (!instance?.name || !remoteJid) return;

    const targetId = message.key?.id || message.id;

    // 1. Instant local update (Shows new text + (edited) badge immediately!)
    setMessageList((prev) =>
      prev.map((m) => {
        const mId = m.key?.id || m.id;
        if (mId === targetId) {
          return {
            ...m,
            message: { conversation: newText, text: newText },
            status: "EDITED",
            isEdited: true,
          };
        }
        return m;
      }),
    );

    // 2. Transmit edit to WhatsApp backend
    try {
      await updateMessage({
        instanceName: instance.name,
        token: instance.token,
        number: remoteJid,
        key: message.key,
        text: newText,
      });
    } catch (err) {
      console.error("Error editing message:", err);
    }
  };

  // Instant Delete for Everyone Handler
  const handleConfirmDelete = async (message: Message) => {
    if (!instance?.name || !remoteJid) return;

    const targetId = message.key?.id || message.id;

    // 1. Instant local update
    setMessageList((prev) =>
      prev.map((m) => {
        const mId = m.key?.id || m.id;
        if (mId === targetId) {
          return {
            ...m,
            isRevoked: true,
            message: { conversation: "Esta mensagem foi apagada" },
          };
        }
        return m;
      }),
    );

    // 2. Transmit revoke to WhatsApp backend
    try {
      await deleteMessage({
        instanceName: instance.name,
        token: instance.token,
        id: message.key.id,
        remoteJid: message.key.remoteJid || remoteJid,
        fromMe: true,
        participant: message.key.participant,
      });
    } catch (err) {
      console.error("Error deleting message:", err);
    }
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
      {/* Header */}
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

      {/* Message List */}
      <MessageList
        messages={messageList}
        remoteJid={remoteJid || ""}
        isLoading={isMessagesLoading}
        lastMessageRef={lastMessageRef}
        onReact={handleSendReaction}
        onReply={(msg) => setReplyingTo(msg)}
        onEdit={(msg) => setEditingMessage(msg)}
        onDelete={(msg) => setDeletingMessage(msg)}
      />

      {/* Input Bar */}
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
