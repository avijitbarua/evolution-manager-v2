import { Bot, BotOff, Tag, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@evoapi/design-system/avatar";
import { Badge } from "@evoapi/design-system/badge";
import { Button } from "@evoapi/design-system/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@evoapi/design-system/dropdown-menu";
import { LabelItem } from "@/lib/queries/chat/chatActions";
import { Chat } from "@/types/evolution.types";

interface ChatHeaderProps {
  chat?: Chat;
  remoteJid: string;
  contactPresence: "composing" | "recording" | null;
  isBotPaused: boolean;
  onToggleBot: () => void;
  availableLabels: LabelItem[];
  chatLabels: string[];
  onToggleLabel: (label: LabelItem) => void;
}

export function ChatHeader({
  chat,
  remoteJid,
  contactPresence,
  isBotPaused,
  onToggleBot,
  availableLabels,
  chatLabels,
  onToggleLabel,
}: ChatHeaderProps) {
  const { t } = useTranslation();

  const headerName = chat?.pushName || remoteJid.split("@")[0];
  const headerSub = remoteJid.split("@")[0];

  return (
    <div className="flex-shrink-0 border-b border-border/60 bg-background/95 p-3.5 backdrop-blur-sm sm:px-4">
      <div className="flex items-center justify-between gap-3">
        {/* Contact Info & Live Presence */}
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={chat?.profilePicUrl} alt={headerName} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="truncate font-semibold leading-tight">{headerName}</h3>

            {contactPresence === "composing" ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 animate-pulse">
                {t("chat.presence.typing", { defaultValue: "digitando..." })}
              </span>
            ) : contactPresence === "recording" ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 animate-pulse">
                {t("chat.presence.recording", { defaultValue: "gravando áudio..." })}
              </span>
            ) : (
              <p className="truncate text-xs text-muted-foreground">{headerSub}</p>
            )}

            {/* Active Label Badges */}
            {chatLabels.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {chatLabels.map((lbl, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="border-primary/20 bg-primary/10 px-1.5 py-0 text-[10px] font-medium text-primary"
                  >
                    {lbl}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls: Bot Switch & Labels Dropdown */}
        <div className="flex items-center gap-2">
          {/* Human Takeover / Bot Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleBot}
            className={`h-8 gap-1.5 px-2.5 text-xs transition-colors ${
              isBotPaused
                ? "border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
            }`}
            title={t("chat.bot.toggleTitle", {
              defaultValue: "Alternar entre Bot automático e Atendimento Humano",
            })}
          >
            {isBotPaused ? (
              <>
                <BotOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {t("chat.bot.paused", { defaultValue: "Humano (Bot Pausado)" })}
                </span>
              </>
            ) : (
              <>
                <Bot className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {t("chat.bot.active", { defaultValue: "Bot Ativo" })}
                </span>
              </>
            )}
          </Button>

          {/* Labels Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs">
                <Tag className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {t("chat.labels.title", { defaultValue: "Etiquetas" })}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {t("chat.labels.manage", { defaultValue: "Gerenciar Etiquetas" })}
              </div>
              {availableLabels.length === 0 ? (
                <div className="p-2 text-xs text-muted-foreground">
                  {t("chat.labels.empty", { defaultValue: "Nenhuma etiqueta cadastrada" })}
                </div>
              ) : (
                availableLabels.map((label) => {
                  const isAssigned =
                    chatLabels.includes(label.name) || chatLabels.includes(label.id);
                  return (
                    <DropdownMenuItem
                      key={label.id}
                      onClick={() => onToggleLabel(label)}
                      className="flex cursor-pointer items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: label.color || "#10b981" }}
                        />
                        <span>{label.name}</span>
                      </div>
                      {isAssigned && <span className="font-bold text-primary">✓</span>}
                    </DropdownMenuItem>
                  );
                })
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
