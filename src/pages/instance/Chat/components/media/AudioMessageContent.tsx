import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Mic, Music, Pause, Play, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Message } from "@/types/evolution.types";
import { useMediaLoader } from "../../hooks/useMediaLoader";
import { formatAudioDuration } from "../../utils/mediaCache";

interface AudioMessageContentProps {
  message: Message;
}

const SPEED_OPTIONS = [1, 1.5, 2];

export function AudioMessageContent({ message }: AudioMessageContentProps) {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    mediaUrl,
    isLoading,
    error,
    duration: rawSeconds,
    loadMedia,
    download,
  } = useMediaLoader(message, { autoLoad: true });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(rawSeconds || 0);
  const [speedIndex, setSpeedIndex] = useState(0);

  const isPtt = !!(message.message?.audioMessage?.ptt ?? true);
  const transcription =
    (message as any).speechToText ||
    message.message?.speechToText ||
    message.message?.audioMessage?.speechToText ||
    (message.message as any)?.transcription;

  // Sync duration if raw duration updates
  useEffect(() => {
    if (rawSeconds && !duration) {
      setDuration(rawSeconds);
    }
  }, [rawSeconds, duration]);

  // Audio event listeners
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && (!duration || isNaN(duration))) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error("Audio playback error:", err);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const toggleSpeed = () => {
    const nextIndex = (speedIndex + 1) % SPEED_OPTIONS.length;
    setSpeedIndex(nextIndex);
    const speed = SPEED_OPTIONS[nextIndex];
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-2 w-full min-w-[260px] max-w-[320px]">
      {/* Hidden native audio element */}
      {mediaUrl && (
        <audio
          ref={audioRef}
          src={mediaUrl}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      )}

      {/* WhatsApp Web Style Audio Player Card */}
      <div className="flex items-center gap-3 py-1">
        {/* Play / Pause / Load Button */}
        {isLoading ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : error ? (
          <button
            type="button"
            onClick={loadMedia}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/20 text-destructive hover:bg-destructive/30 transition-transform active:scale-95"
            title="Retry download"
          >
            <Play className="h-5 w-5 translate-x-0.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={togglePlay}
            disabled={!mediaUrl}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition-transform active:scale-95 disabled:opacity-50"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 translate-x-0.5" />
            )}
          </button>
        )}

        {/* Center Waveform & Progress Scrubber */}
        <div className="flex flex-1 flex-col justify-center gap-1.5 min-w-0">
          {/* Custom Styled Slider */}
          <div className="relative flex items-center h-4">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={!mediaUrl}
              className="w-full h-1.5 appearance-none rounded-full bg-muted-foreground/30 accent-primary cursor-pointer disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(to right, currentColor ${progressPercent}%, rgba(150, 150, 150, 0.25) ${progressPercent}%)`,
              }}
            />
          </div>

          {/* Time & Duration Display */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span>{formatAudioDuration(currentTime)}</span>
            <span>{formatAudioDuration(duration)}</span>
          </div>
        </div>

        {/* Right Side: Speed Pill & Mic/Music Avatar */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Speed Multiplier Pill */}
          {isPlaying && (
            <button
              type="button"
              onClick={toggleSpeed}
              className="rounded-full bg-muted-foreground/15 px-2 py-0.5 text-[10px] font-semibold text-foreground/80 hover:bg-muted-foreground/25 transition-colors"
              title="Playback speed"
            >
              {SPEED_OPTIONS[speedIndex]}x
            </button>
          )}

          {/* Voice Note / Audio Icon Badge */}
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              isPtt
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-blue-500/15 text-blue-500"
            }`}
            title={isPtt ? "Voice Note" : "Audio"}
          >
            {isPtt ? <Mic className="h-4 w-4" /> : <Music className="h-4 w-4" />}
          </div>

          {/* Download Action */}
          {mediaUrl && (
            <button
              type="button"
              onClick={() => download()}
              className="opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity p-1 text-muted-foreground"
              title="Download audio"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Speech-to-Text Transcription Banner */}
      {transcription && (
        <div className="mt-1 rounded-md border border-border/50 bg-background/60 p-2.5 text-xs italic text-foreground/90 backdrop-blur-xs">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-[10px] text-primary not-italic">
            <Sparkles className="h-3 w-3" />
            <span>{t("chat.audio.transcription", { defaultValue: "Transcrição automática" })}</span>
          </div>
          <p className="leading-relaxed whitespace-pre-wrap">{transcription}</p>
        </div>
      )}
    </div>
  );
}
