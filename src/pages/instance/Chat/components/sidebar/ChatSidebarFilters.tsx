import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export type FilterType = "all" | "unread" | "favourites" | "groups";

interface ChatSidebarFiltersProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  unreadCount: number;
  groupsCount: number;
  favouritesCount?: number;
}

export function ChatSidebarFilters({
  currentFilter,
  onFilterChange,
  unreadCount,
  groupsCount,
  favouritesCount = 0,
}: ChatSidebarFiltersProps) {
  const { t } = useTranslation();

  const filters: { id: FilterType; label: string; count?: number }[] = [
    { id: "all", label: t("chat.filters.all", { defaultValue: "All" }) },
    {
      id: "unread",
      label: t("chat.filters.unread", { defaultValue: "Unread" }),
      count: unreadCount,
    },
    {
      id: "favourites",
      label: t("chat.filters.favourites", { defaultValue: "Favourites" }),
      count: favouritesCount > 0 ? favouritesCount : undefined,
    },
    {
      id: "groups",
      label: t("chat.filters.groups", { defaultValue: "Groups" }),
      count: groupsCount,
    },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-3 pb-2 scrollbar-none">
      {filters.map((f) => {
        const isActive = currentFilter === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onFilterChange(f.id)}
            className={cn(
              "flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span>{f.label}</span>
            {f.count !== undefined && f.count > 0 && (
              <span
                className={cn(
                  "rounded-full px-1 text-[10px] font-semibold",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary/10 text-primary",
                )}
              >
                {f.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
