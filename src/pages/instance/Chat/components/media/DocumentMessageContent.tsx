import { Download, File, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Message } from "@/types/evolution.types";
import { useMediaLoader } from "../../hooks/useMediaLoader";
import { formatFileSize } from "../../utils/mediaCache";

interface DocumentMessageContentProps {
  message: Message;
}

const getDocumentIcon = (fileName?: string) => {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return <FileText className="h-7 w-7 text-red-500" />;
    case "doc":
    case "docx":
      return <FileText className="h-7 w-7 text-blue-500" />;
    case "xls":
    case "xlsx":
    case "csv":
      return <FileSpreadsheet className="h-7 w-7 text-emerald-500" />;
    default:
      return <File className="h-7 w-7 text-amber-500" />;
  }
};

export function DocumentMessageContent({ message }: DocumentMessageContentProps) {
  const {
    mediaUrl,
    fileName,
    fileSize,
    isLoading,
    loadMedia,
    download,
  } = useMediaLoader(message, { autoLoad: false });

  const rawFileName = message.message?.documentMessage?.fileName || fileName || "Document";
  const rawSize = message.message?.documentMessage?.fileLength || fileSize;

  const handleAction = () => {
    if (mediaUrl) {
      download(rawFileName);
    } else {
      loadMedia().then(() => {
        download(rawFileName);
      });
    }
  };

  return (
    <div
      onClick={handleAction}
      className="flex max-w-xs cursor-pointer items-center gap-3 rounded-lg border border-border/40 bg-black/5 dark:bg-white/5 p-3 hover:bg-black/10 dark:hover:bg-white/10 transition-colors group"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-background shadow-xs">
        {getDocumentIcon(rawFileName)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground group-hover:underline" title={rawFileName}>
          {rawFileName}
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          {formatFileSize(typeof rawSize === "object" ? rawSize.low : rawSize) || "Document"}
        </p>
      </div>

      <div className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Download className="h-5 w-5" />
        )}
      </div>
    </div>
  );
}
