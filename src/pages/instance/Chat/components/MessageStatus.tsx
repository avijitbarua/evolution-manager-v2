import { Check, CheckCheck, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getMessageStatus } from "../utils/messageStatus";

interface MessageStatusProps {
  message: any;
}

export function MessageStatus({ message }: MessageStatusProps) {
  const { t } = useTranslation();
  const status = getMessageStatus(message);

  if (status === 4 || status === 5) {
    return (
      <span title={t("chat.status.read", { defaultValue: "Lida" })}>
        <CheckCheck className="h-3 w-3 text-sky-400" />
      </span>
    );
  }

  if (status === 3) {
    return (
      <span title={t("chat.status.delivered", { defaultValue: "Entregue" })}>
        <CheckCheck className="h-3 w-3 text-muted-foreground" />
      </span>
    );
  }

  if (status === 2) {
    return (
      <span title={t("chat.status.sent", { defaultValue: "Enviada" })}>
        <Check className="h-3 w-3 text-muted-foreground" />
      </span>
    );
  }

  return (
    <span title={t("chat.status.pending", { defaultValue: "Pendente" })}>
      <Clock className="h-3 w-3 text-muted-foreground" />
    </span>
  );
}
