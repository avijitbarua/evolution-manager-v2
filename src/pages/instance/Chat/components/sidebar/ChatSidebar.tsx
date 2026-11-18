import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquareDashed } from "lucide-react";
import { Chat } from "@/types/evolution.types";
import { getMessageText } from "../../utils/messageStatus";
import { sortChatsByLatest } from "../../utils/chatListUtils";
import { ChatSidebarFilters, FilterType } from "./ChatSidebarFilters";
import { ChatSidebarHeader } from "./ChatSidebarHeader";
import { ChatSidebarSearch } from "./ChatSidebarSearch";
import { ChatListItem } from "./ChatListItem";

interface ChatSidebarProps {
  chats: Chat[];
  selectedRemoteJid?: string;
  onSelectChat: (remoteJid: string) => void;
  onNewChat?: () => void;
}

export function ChatSidebar({
  chats,
  selectedRemoteJid,
  onSelectChat,
  onNewChat,
}: ChatSidebarProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  // Compute live counts
  const unreadCount = useMemo(() => {
    return chats.filter((c) => (c.unreadCount || 0) > 0).length;
  }, [chats]);

  const groupsCount = useMemo(() => {
    return chats.filter((c) => c.remoteJid.endsWith("@g.us")).length;
  }, [chats]);

  // Filter and sort chats by latest conversation time (WhatsApp Web order!)
  const visibleChats = useMemo(() => {
    // 1. Filter by category pill
    let filtered = chats;
    if (filter === "unread") {
      filtered = filtered.filter((c) => (c.unreadCount || 0) > 0);
    } else if (filter === "groups") {
      filtered = filtered.filter((c) => c.remoteJid.endsWith("@g.us"));
    } else if (filter === "favourites") {
      // Optional favourites filter (e.g. chats with special label or saved)
      filtered = filtered.filter((c) => (c as any).isFavourite || (c as any).isSaved);
    }

    // 2. Filter by search query (matches name, phone number, or last message text)
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((c) => {
        const nameMatch = c.pushName && c.pushName.toLowerCase().includes(q);
        const jidMatch = c.remoteJid.toLowerCase().includes(q);
        const lastMsgText = getMessageText(c.lastMessage?.message);
        const msgMatch = lastMsgText && lastMsgText.toLowerCase().includes(q);
        return nameMatch || jidMatch || msgMatch;
      });
    }

    // 3. Sort strictly by latest activity / message timestamp descending
    return sortChatsByLatest(filtered);
  }, [chats, filter, search]);

  return (
    <aside className="flex h-full w-full flex-col border-r bg-card/60 backdrop-blur-sm md:w-96 md:shrink-0">
      {/* 1. WhatsApp Top Header */}
      <ChatSidebarHeader onNewChat={onNewChat} />

      {/* 2. WhatsApp Search Bar */}
      <ChatSidebarSearch value={search} onChange={setSearch} />

      {/* 3. WhatsApp Filter Pills (All, Unread, Favourites, Groups) */}
      <ChatSidebarFilters
        currentFilter={filter}
        onFilterChange={setFilter}
        unreadCount={unreadCount}
        groupsCount={groupsCount}
      />

      {/* 4. Chat List sorted by latest conversation time */}
      <div className="flex-1 overflow-y-auto">
        {visibleChats.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <MessageSquareDashed className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium">
              {search
                ? t("chat.empty.search", { defaultValue: "Nenhuma conversa encontrada" })
                : filter === "unread"
                ? "Nenhuma conversa não lida"
                : t("chat.empty.default", { defaultValue: "Nenhuma conversa ainda" })}
            </p>
            {search && (
              <p className="mt-1 text-xs text-muted-foreground/70">
                {t("chat.empty.tryAnother", { defaultValue: "Tente outro termo de busca" })}
              </p>
            )}
          </div>
        ) : (
          visibleChats.map((chat) => (
            <ChatListItem
              key={chat.remoteJid}
              chat={chat}
              selected={selectedRemoteJid === chat.remoteJid}
              onClick={() => onSelectChat(chat.remoteJid)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
