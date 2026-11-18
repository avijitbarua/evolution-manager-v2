import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@evoapi/design-system/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Message } from "@/types/evolution.types";
import { getMessageText } from "../utils/messageStatus";

interface EditMessageModalProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (message: Message, newText: string) => Promise<void>;
}

export function EditMessageModal({
  message,
  isOpen,
  onClose,
  onSave,
}: EditMessageModalProps) {
  const { t } = useTranslation();
  const [editText, setEditText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (message) {
      setEditText(getMessageText(message.message));
    } else {
      setEditText("");
    }
  }, [message]);

  const handleSave = async () => {
    if (!message || !editText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSave(message, editText.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("chat.edit.title", { defaultValue: "Editar Mensagem" })}</DialogTitle>
          <DialogDescription>
            {t("chat.edit.description", {
              defaultValue:
                "Edite o texto da sua mensagem. Ela será atualizada para todos os participantes.",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="resize-none"
            placeholder={t("chat.edit.placeholder", { defaultValue: "Digite o novo texto..." })}
            disabled={isSubmitting}
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {t("chat.edit.timeLimit", {
              defaultValue:
                "Mensagens só podem ser editadas em até 15 minutos após o envio.",
            })}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t("chat.edit.cancel", { defaultValue: "Cancelar" })}
          </Button>
          <Button onClick={handleSave} disabled={!editText.trim() || isSubmitting}>
            {t("chat.edit.save", { defaultValue: "Salvar Alteração" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
