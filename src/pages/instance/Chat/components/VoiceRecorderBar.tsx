import { Send, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@evoapi/design-system/button";

interface VoiceRecorderBarProps {
  recordingDuration: number;
  onCancel: () => void;
  onSend: () => void;
}

export function VoiceRecorderBar({
  recordingDuration,
  onCancel,
  onSend,
}: VoiceRecorderBarProps) {
  const { t } = useTranslation();

  const minutes = Math.floor(recordingDuration / 60);
  const seconds = (recordingDuration % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-1 items-center justify-between rounded-lg bg-destructive/10 px-3 py-1.5">
      <div className="flex items-center gap-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-mono font-medium text-destructive">
          {minutes}:{seconds}
        </span>
        <span className="text-xs text-muted-foreground">
          {t("chat.audio.recording", { defaultValue: "Gravando mensagem de voz..." })}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-8 w-8 text-destructive hover:bg-destructive/20"
          title={t("chat.audio.cancel", { defaultValue: "Cancelar gravação" })}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          onClick={onSend}
          className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
          title={t("chat.audio.send", { defaultValue: "Enviar mensagem de voz" })}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
