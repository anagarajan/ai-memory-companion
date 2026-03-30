import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Pause, Send, Trash2 } from "lucide-react";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { cn } from "@/lib/utils";

function formatElapsed(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

type PanelState = "recording" | "paused";

interface VoiceRecordingPanelProps {
  onSend: (blob: Blob) => void;
  onDiscard: () => void;
}

export function VoiceRecordingPanel({ onSend, onDiscard }: VoiceRecordingPanelProps) {
  const {
    isRecording,
    isPaused,
    elapsed,
    analyserNode,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    discardRecording,
  } = useVoiceRecorder();

  const [state, setState] = useState<PanelState>("recording");
  const [barsSnapshot, setBarsSnapshot] = useState<number[]>([]);
  const [pausedDuration, setPausedDuration] = useState(0);

  // Capture waveform bars during recording
  const barsAccRef = useRef<number[]>([]);

  useEffect(() => {
    if (!analyserNode || !isRecording || isPaused) return;

    const data = new Uint8Array(analyserNode.frequencyBinCount);
    let frame: number;

    function sample(): void {
      analyserNode!.getByteFrequencyData(data);
      const avg = data.reduce((s, v) => s + v, 0) / data.length / 255;
      barsAccRef.current.push(Math.max(0.05, avg));
      if (barsAccRef.current.length > 200) {
        barsAccRef.current = barsAccRef.current.filter((_, i) => i % 2 === 0);
      }
      frame = requestAnimationFrame(sample);
    }
    sample();

    return () => cancelAnimationFrame(frame);
  }, [analyserNode, isRecording, isPaused]);

  // Auto-start recording on mount
  useEffect(() => {
    startRecording().catch(() => {
      onDiscard();
    });

    return () => {
      discardRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync hook state to panel state
  useEffect(() => {
    if (isRecording && !isPaused) setState("recording");
    else if (isRecording && isPaused) setState("paused");
  }, [isRecording, isPaused]);

  const handlePause = useCallback((): void => {
    pauseRecording();
    setBarsSnapshot([...barsAccRef.current]);
    setPausedDuration(elapsed);
  }, [pauseRecording, elapsed]);

  const handleResume = useCallback((): void => {
    resumeRecording();
  }, [resumeRecording]);

  const handleSend = useCallback(async (): Promise<void> => {
    const recordedBlob = await stopRecording();
    if (recordedBlob) {
      onSend(recordedBlob);
    }
  }, [stopRecording, onSend]);

  const handleDiscard = useCallback((): void => {
    discardRecording();
    onDiscard();
  }, [discardRecording, onDiscard]);

  return (
    <div className="animate-slide-up space-y-3">
      {/* Top section — live waveform while recording */}
      {state === "recording" && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[18px] bg-ios-fill">
          <span className="w-2 h-2 rounded-full bg-ios-red animate-blink shrink-0" />
          <span className="text-[15px] font-semibold tabular-nums text-ios-red w-12">
            {formatElapsed(elapsed)}
          </span>
          <div className="flex-1 min-w-0">
            <WaveformVisualizer
              mode="live"
              analyserNode={analyserNode}
              color="var(--color-ios-red)"
              height={28}
              barWidth={2}
              barGap={2}
            />
          </div>
        </div>
      )}

      {/* Top section — static waveform when paused */}
      {state === "paused" && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[18px] bg-ios-fill">
          <div className="flex-1 min-w-0">
            <WaveformVisualizer
              mode="static"
              bars={barsSnapshot}
              color="var(--color-ios-gray-3)"
              playedColor="var(--color-ios-purple)"
              height={28}
              barWidth={2}
              barGap={2}
            />
          </div>
          <span className="text-[14px] font-medium tabular-nums text-ios-gray-1 w-10 text-right">
            {formatElapsed(pausedDuration)}
          </span>
        </div>
      )}

      {/* Bottom action row: Delete | Pause/Resume | Send */}
      <div className="flex items-center justify-between px-2">
        {/* Delete */}
        <button
          type="button"
          onClick={handleDiscard}
          className="flex items-center justify-center w-[44px] h-[44px] rounded-full border-0 text-ios-red hover:bg-ios-red/10 transition-colors"
        >
          <Trash2 size={22} />
        </button>

        {/* Center — Pause or Resume */}
        {state === "recording" ? (
          <button
            type="button"
            onClick={handlePause}
            className={cn(
              "flex items-center justify-center w-[52px] h-[52px] rounded-full border-[3px] border-ios-red",
              "text-ios-red transition-all hover:bg-ios-red/10",
            )}
          >
            <Pause size={22} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleResume}
            className={cn(
              "flex items-center justify-center w-[52px] h-[52px] rounded-full border-[3px] border-ios-red",
              "text-ios-red transition-all hover:bg-ios-red/10",
            )}
          >
            <Mic size={22} />
          </button>
        )}

        {/* Send */}
        <button
          type="button"
          onClick={() => void handleSend()}
          className="flex items-center justify-center w-[44px] h-[44px] rounded-full border-0 bg-ios-green text-white transition-all hover:brightness-110 active:scale-95"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
