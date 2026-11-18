import { Archive, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface ChatSpecialRowsProps {
  archivedCount: number;
  lockedCount: number;
  onOpenArchived: () => void;
  onOpenLocked: () => void;
}

export function ChatSpecialRows({
  archivedCount,
  lockedCount,
  onOpenArchived,
  onOpenLocked,
}: ChatSpecialRowsProps) {
  const { t } = useTranslation();

  return (
    <div className="border-b border-border/40 py-1">
      {/* 1. Locked Chats Row */}
      <button
        type="button"
        onClick={onOpenLocked}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent/50"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-7 w-7 items-center justify-center text-muted-foreground">
            <Lock className="h-4 w-4" />
          </div>
          <span className="font-medium text-foreground">
            {t("chat.locked.title", { defaultValue: "Locked chats" })}
          </span>
        </div>
        {lockedCount > 0 && (
          <span className="text-xs font-semibold text-muted-foreground">
            {lockedCount}
          </span>
        )}
      </button>

      {/* 2. Archived Chats Row */}
      <button
        type="button"
        onClick={onOpenArchived}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent/50"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-7 w-7 items-center justify-center text-muted-foreground">
            <Archive className="h-4 w-4" />
          </div>
          <span className="font-medium text-foreground">
            {t("chat.archived.title", { defaultValue: "Archived" })}
          </span>
        </div>
        {archivedCount > 0 && (
          <span
            className={cn(
              "text-xs font-semibold text-muted-foreground",
            )}
          >
            {archivedCount}
          </span>
        )}
      </button>
    </div>
  );
}
