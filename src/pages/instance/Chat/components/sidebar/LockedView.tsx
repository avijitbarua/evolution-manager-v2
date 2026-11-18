import { ArrowLeft, Lock, Unlock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@evoapi/design-system/button";
import { Chat } from "@/types/evolution.types";
import { ChatListItem } from "./ChatListItem";

interface LockedViewProps {
  lockedChats: Chat[];
  selectedRemoteJid?: string;
  onSelectChat: (remoteJid: string) => void;
  onUnlockChat: (remoteJid: string) => void;
  onBack: () => void;
}

export function LockedView({
  lockedChats,
  selectedRemoteJid,
  onSelectChat,
  onUnlockChat,
  onBack,
}: LockedViewProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-full flex-col bg-card/60">
      {/* Header with Back button */}
      <div className="flex h-14 items-center gap-3 border-b border-border/40 px-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-500" />
          <h2 className="text-base font-semibold text-foreground">
            {t("chat.locked.title", { defaultValue: "Locked chats" })}
          </h2>
          <span className="text-xs text-muted-foreground">({lockedChats.length})</span>
        </div>
      </div>

      {/* Info banner */}
      <div className="border-b border-border/30 bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
        {t("chat.locked.notice", {
          defaultValue: "Essas conversas são mantidas em um espaço reservado e seguro.",
        })}
      </div>

      {/* Locked Chats List */}
      <div className="flex-1 overflow-y-auto">
        {lockedChats.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <Lock className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">
              {t("chat.locked.empty", { defaultValue: "Nenhuma conversa bloqueada" })}
            </p>
          </div>
        ) : (
          lockedChats.map((chat) => (
            <div key={chat.remoteJid} className="group relative">
              <ChatListItem
                chat={chat}
                selected={selectedRemoteJid === chat.remoteJid}
                onClick={() => onSelectChat(chat.remoteJid)}
              />
              {/* Unlock action button on hover */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlockChat(chat.remoteJid);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-1.5 text-muted-foreground opacity-0 shadow-sm transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
                title={t("chat.locked.unlock", { defaultValue: "Desbloquear conversa" })}
              >
                <Unlock className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
