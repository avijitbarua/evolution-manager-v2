import { Dispatch, RefObject, SetStateAction } from "react";
import { Mic, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@evoapi/design-system/button";
import { Textarea } from "@/components/ui/textarea";
import { Instance, Message } from "@/types/evolution.types";
import { MediaOptions } from "../../EmbedChatMessage/InputMessage/media-options";
import { SelectedMedia } from "../../EmbedChatMessage/InputMessage/selected-media";
import { QuotedReplyBanner } from "./QuotedReplyBanner";
import { VoiceRecorderBar } from "./VoiceRecorderBar";

interface ChatInputBarProps {
  instance: Instance | null;
  messageText: string;
  textareaRef: RefObject<HTMLTextAreaElement>;
  textareaHeight: string;
  isSending: boolean;
  selectedMedia: File | null;
  replyingTo: Message | null;
  isRecording: boolean;
  recordingDuration: number;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  onCancelReply: () => void;
  setSelectedMedia: Dispatch<SetStateAction<File | null>>;
  onStartRecording: () => void;
  onCancelRecording: () => void;
  onStopAndSendRecording: () => void;
}

export function ChatInputBar({
  instance,
  messageText,
  textareaRef,
  textareaHeight,
  isSending,
  selectedMedia,
  replyingTo,
  isRecording,
  recordingDuration,
  onInputChange,
  onKeyDown,
  onSendMessage,
  onCancelReply,
  setSelectedMedia,
  onStartRecording,
  onCancelRecording,
  onStopAndSendRecording,
}: ChatInputBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex-shrink-0 border-t border-border/60 bg-background p-3">
      <div className="rounded-lg border border-border bg-card shadow-xs">
        {/* Quoted Message Preview Banner */}
        <QuotedReplyBanner replyingTo={replyingTo} onCancel={onCancelReply} />

        {/* Selected Media Preview Banner */}
        {selectedMedia && (
          <div className="border-b border-border bg-muted/30 px-3 py-2">
            <SelectedMedia selectedMedia={selectedMedia} setSelectedMedia={setSelectedMedia} />
          </div>
        )}

        {/* Input Bar Row */}
        <div className="flex items-center gap-2 px-2 py-1.5">
          {isRecording ? (
            <VoiceRecorderBar
              recordingDuration={recordingDuration}
              onCancel={onCancelRecording}
              onSend={onStopAndSendRecording}
            />
          ) : (
            <>
              {/* Media Attach Options */}
              <div className="flex flex-shrink-0 items-center">
                {instance && (
                  <MediaOptions instance={instance} setSelectedMedia={setSelectedMedia} />
                )}
              </div>

              {/* Textarea */}
              <Textarea
                placeholder={t("chat.input.placeholder", { defaultValue: "Type a message..." })}
                name="message"
                id="message"
                rows={1}
                ref={textareaRef}
                value={messageText}
                onChange={onInputChange}
                onKeyDown={onKeyDown}
                disabled={isSending}
                style={{ height: textareaHeight }}
                className="min-h-9 flex-1 resize-none border-none bg-transparent px-2 py-1.5 text-sm shadow-none focus-visible:outline-hidden focus-visible:ring-0 focus-visible:ring-offset-0"
              />

              {/* Mic Icon when empty, Send Icon when text or media present */}
              {!messageText.trim() && !selectedMedia ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onStartRecording}
                  className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-primary"
                  title={t("chat.audio.send", { defaultValue: "Gravar áudio de voz" })}
                >
                  <Mic className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  onClick={onSendMessage}
                  disabled={isSending}
                  className="h-9 w-9 flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/85 disabled:opacity-50"
                  title={t("chat.input.send", { defaultValue: "Send" })}
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
  );
}
