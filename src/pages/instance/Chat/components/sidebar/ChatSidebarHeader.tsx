import { MessageSquarePlus, MoreVertical } from "lucide-react";
import { Button } from "@evoapi/design-system/button";

interface ChatSidebarHeaderProps {
  onNewChat?: () => void;
}

export function ChatSidebarHeader({ onNewChat }: ChatSidebarHeaderProps) {
  return (
    <div className="flex h-14 items-center justify-between px-4">
      <h1 className="text-xl font-bold tracking-tight text-foreground">WhatsApp</h1>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={onNewChat}
          title="Nova conversa"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Mais opções"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
