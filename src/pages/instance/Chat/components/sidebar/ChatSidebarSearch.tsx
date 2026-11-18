import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";

interface ChatSidebarSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ChatSidebarSearch({ value, onChange }: ChatSidebarSearchProps) {
  const { t } = useTranslation();

  return (
    <div className="px-3 pb-2">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t("chat.search", { defaultValue: "Search or start a new chat" })}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full rounded-lg bg-muted/60 pl-9 pr-8 text-sm focus-visible:bg-background focus-visible:ring-1"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2.5 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
