import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquareDashed } from "lucide-react";
import { archiveChatApi } from "@/lib/queries/chat/archiveChat";
import { Chat } from "@/types/evolution.types";
import { sortChatsByLatest } from "../../utils/chatListUtils";
import {
  getArchivedJids,
  getLockedJids,
  setArchivedJid,
  setLockedJid,
} from "../../utils/chatStorage";
import { getMessageText } from "../../utils/messageStatus";
import { ArchivedView } from "./ArchivedView";
import { ChatListItem } from "./ChatListItem";
import { ChatSidebarFilters, FilterType } from "./ChatSidebarFilters";
import { ChatSidebarHeader } from "./ChatSidebarHeader";
import { ChatSidebarSearch } from "./ChatSidebarSearch";
import { ChatSpecialRows } from "./ChatSpecialRows";
import { LockedView } from "./LockedView";

interface ChatSidebarProps {
  chats: Chat[];
  instanceName?: string;
  instanceToken?: string;
  selectedRemoteJid?: string;
  onSelectChat: (remoteJid: string) => void;
  onNewChat?: () => void;
}

export function ChatSidebar({
  chats,
  instanceName,
  instanceToken,
  selectedRemoteJid,
  onSelectChat,
  onNewChat,
}: ChatSidebarProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [viewState, setViewState] = useState<"main" | "archived" | "locked">("main");

  // Track archived and locked JIDs
  const [archivedJids, setArchivedJids] = useState<Set<string>>(() =>
    getArchivedJids(instanceName),
  );
  const [lockedJids, setLockedJids] = useState<Set<string>>(() =>
    getLockedJids(instanceName),
  );

  useEffect(() => {
    if (instanceName) {
      setArchivedJids(getArchivedJids(instanceName));
      setLockedJids(getLockedJids(instanceName));
    }
  }, [instanceName]);

  const isArchived = (jid: string) => {
    const clean = jid.split("@")[0];
    return (
      archivedJids.has(jid) ||
      archivedJids.has(`${clean}@s.whatsapp.net`) ||
      archivedJids.has(`${clean}@lid`)
    );
  };

  const isLocked = (jid: string) => {
    const clean = jid.split("@")[0];
    return lockedJids.has(jid) || lockedJids.has(`${clean}@s.whatsapp.net`);
  };

  // Archive / Unarchive Actions
  const handleArchive = async (jid: string) => {
    if (!instanceName) return;
    const next = setArchivedJid(instanceName, jid, true);
    setArchivedJids(next);

    await archiveChatApi({
      instanceName,
      token: instanceToken,
      chat: jid,
      archive: true,
    });
  };

  const handleUnarchive = async (jid: string) => {
    if (!instanceName) return;
    const next = setArchivedJid(instanceName, jid, false);
    setArchivedJids(next);

    await archiveChatApi({
      instanceName,
      token: instanceToken,
      chat: jid,
      archive: false,
    });
  };

  const handleUnlock = (jid: string) => {
    if (!instanceName) return;
    const next = setLockedJid(instanceName, jid, false);
    setLockedJids(next);
  };

  // Split chats into active, archived, and locked
  const { activeChats, archivedChats, lockedChats } = useMemo(() => {
    const active: Chat[] = [];
    const archived: Chat[] = [];
    const locked: Chat[] = [];

    chats.forEach((chat) => {
      if (isArchived(chat.remoteJid)) {
        archived.push({ ...chat, isArchived: true });
      } else if (isLocked(chat.remoteJid)) {
        locked.push({ ...chat, isLocked: true });
      } else {
        active.push(chat);
      }
    });

    return {
      activeChats: sortChatsByLatest(active),
      archivedChats: sortChatsByLatest(archived),
      lockedChats: sortChatsByLatest(locked),
    };
  }, [chats, archivedJids, lockedJids]);

  // Compute live counts
  const unreadCount = useMemo(() => {
    return activeChats.filter((c) => (c.unreadCount || 0) > 0).length;
  }, [activeChats]);

  const groupsCount = useMemo(() => {
    return activeChats.filter((c) => c.remoteJid.endsWith("@g.us")).length;
  }, [activeChats]);

  // Filter and sort active chats for main list
  const visibleChats = useMemo(() => {
    let filtered = activeChats;

    if (filter === "unread") {
      filtered = filtered.filter((c) => (c.unreadCount || 0) > 0);
    } else if (filter === "groups") {
      filtered = filtered.filter((c) => c.remoteJid.endsWith("@g.us"));
    } else if (filter === "favourites") {
      filtered = filtered.filter((c) => (c as any).isFavourite || (c as any).isSaved);
    }

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

    return sortChatsByLatest(filtered);
  }, [activeChats, filter, search]);

  // 1. Render Archived Chats View
  if (viewState === "archived") {
    return (
      <aside className="flex h-full w-full flex-col border-r bg-card/60 backdrop-blur-sm md:w-96 md:shrink-0">
        <ArchivedView
          archivedChats={archivedChats}
          selectedRemoteJid={selectedRemoteJid}
          onSelectChat={onSelectChat}
          onUnarchiveChat={handleUnarchive}
          onBack={() => setViewState("main")}
        />
      </aside>
    );
  }

  // 2. Render Locked Chats View
  if (viewState === "locked") {
    return (
      <aside className="flex h-full w-full flex-col border-r bg-card/60 backdrop-blur-sm md:w-96 md:shrink-0">
        <LockedView
          lockedChats={lockedChats}
          selectedRemoteJid={selectedRemoteJid}
          onSelectChat={onSelectChat}
          onUnlockChat={handleUnlock}
          onBack={() => setViewState("main")}
        />
      </aside>
    );
  }

  // 3. Render Main WhatsApp Web Chat List
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

      {/* 4. WhatsApp Special Rows (Locked chats, Archived) */}
      <ChatSpecialRows
        archivedCount={archivedChats.length}
        lockedCount={lockedChats.length}
        onOpenArchived={() => setViewState("archived")}
        onOpenLocked={() => setViewState("locked")}
      />

      {/* 5. Main Active Chat List (Sorted by latest conversation time) */}
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
              onArchive={() => handleArchive(chat.remoteJid)}
              isArchived={false}
            />
          ))
        )}
      </div>
    </aside>
  );
}
