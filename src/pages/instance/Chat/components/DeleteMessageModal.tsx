import { useState } from "react";
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
import { Message } from "@/types/evolution.types";

interface DeleteMessageModalProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: Message) => Promise<void>;
}

export function DeleteMessageModal({
  message,
  isOpen,
  onClose,
  onConfirm,
}: DeleteMessageModalProps) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!message || isDeleting) return;

    try {
      setIsDeleting(true);
      await onConfirm(message);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("chat.delete.title", { defaultValue: "Apagar Mensagem para Todos?" })}
          </DialogTitle>
          <DialogDescription>
            {t("chat.delete.description", {
              defaultValue:
                "Tem certeza de que deseja apagar esta mensagem para todos os participantes da conversa?",
            })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            {t("chat.delete.cancel", { defaultValue: "Cancelar" })}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {t("chat.delete.confirm", { defaultValue: "Apagar para Todos" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
