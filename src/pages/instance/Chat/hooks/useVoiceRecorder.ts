import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { sendPresence } from "@/lib/queries/chat/chatActions";

interface UseVoiceRecorderProps {
  instanceName?: string;
  instanceToken?: string;
  remoteJid?: string;
  onSendAudio: (base64Audio: string) => Promise<void>;
}

export function useVoiceRecorder({
  instanceName,
  instanceToken,
  remoteJid,
  onSendAudio,
}: UseVoiceRecorderProps) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      if (instanceName && remoteJid) {
        sendPresence({
          instanceName,
          token: instanceToken,
          number: remoteJid,
          presence: "recording",
        });
      }
    } catch (err) {
      console.error("Microphone access error:", err);
      alert(
        t("chat.audio.micPermissionError", {
          defaultValue: "Não foi possível acessar o microfone. Verifique as permissões do navegador.",
        }),
      );
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];

    if (instanceName && remoteJid) {
      sendPresence({
        instanceName,
        token: instanceToken,
        number: remoteJid,
        presence: "paused",
      });
    }
  };

  const stopAndSendRecording = async () => {
    if (!mediaRecorderRef.current || !instanceName || !remoteJid) return;

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" });
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(",")[1];
        try {
          await onSendAudio(base64Audio);
        } catch (error) {
          console.error("Error sending voice recording:", error);
        } finally {
          setIsRecording(false);
          setRecordingDuration(0);
          audioChunksRef.current = [];
        }
      };
    };

    mediaRecorderRef.current.stop();
    sendPresence({
      instanceName,
      token: instanceToken,
      number: remoteJid,
      presence: "paused",
    });
  };

  return {
    isRecording,
    recordingDuration,
    startRecording,
    cancelRecording,
    stopAndSendRecording,
  };
}
