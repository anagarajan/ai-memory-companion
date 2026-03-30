import { useCallback, useRef, useState } from "react";

function getSupportedMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

export interface VoiceRecorderResult {
  isRecording: boolean;
  isPaused: boolean;
  elapsed: number;
  audioLevel: number;
  analyserNode: AnalyserNode | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  discardRecording: () => void;
}

export function useVoiceRecorder(): VoiceRecorderResult {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accumulatedMsRef = useRef<number>(0);
  const lastResumeRef = useRef<number>(0);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  function stopTimer(): void {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopAnimFrame(): void {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }

  function cleanupAudio(): void {
    stopAnimFrame();
    stopTimer();
    setAnalyserNode(null);
    analyserRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
    setAudioLevel(0);
    setElapsed(0);
    accumulatedMsRef.current = 0;
    lastResumeRef.current = 0;
  }

  function releaseStream(): void {
    const recorder = recorderRef.current;
    if (recorder?.stream) {
      recorder.stream.getTracks().forEach((t) => t.stop());
    }
    recorderRef.current = null;
    chunksRef.current = [];
  }

  function startElapsedTimer(): void {
    lastResumeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const total = accumulatedMsRef.current + (Date.now() - lastResumeRef.current);
      setElapsed(Math.floor(total / 1000));
    }, 250);
  }

  async function startRecording(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getSupportedMimeType();
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];
    accumulatedMsRef.current = 0;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    // Audio analysis via AnalyserNode
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      setAnalyserNode(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      function tick(): void {
        analyser.getByteFrequencyData(data);
        const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length) / 128;
        setAudioLevel(Math.min(rms, 1));
        animFrameRef.current = requestAnimationFrame(tick);
      }
      tick();
    } catch {
      // AnalyserNode is best-effort; recording still works without it
    }

    startElapsedTimer();
    recorder.start(200);
    setIsRecording(true);
    setIsPaused(false);
  }

  const pauseRecording = useCallback((): void => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    // Feature-detect pause support
    if (typeof recorder.pause === "function") {
      recorder.pause();
    }

    // Accumulate elapsed time
    accumulatedMsRef.current += Date.now() - lastResumeRef.current;
    stopTimer();
    stopAnimFrame();
    setAudioLevel(0);
    setIsPaused(true);
  }, []);

  const resumeRecording = useCallback((): void => {
    const recorder = recorderRef.current;
    if (!recorder) return;

    if (typeof recorder.resume === "function" && recorder.state === "paused") {
      recorder.resume();
    }

    // Restart animation frame for waveform
    const analyser = analyserRef.current;
    if (analyser) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      const node = analyser; // capture non-null reference
      function tick(): void {
        node.getByteFrequencyData(data);
        const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length) / 128;
        setAudioLevel(Math.min(rms, 1));
        animFrameRef.current = requestAnimationFrame(tick);
      }
      tick();
    }

    startElapsedTimer();
    setIsPaused(false);
  }, []);

  async function stopRecording(): Promise<Blob | null> {
    const recorder = recorderRef.current;
    cleanupAudio();
    if (!recorder) return null;

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        releaseStream();
        setIsRecording(false);
        setIsPaused(false);
        resolve(blob.size > 0 ? blob : null);
      };
      if (recorder.state !== "inactive") {
        recorder.stop();
      } else {
        releaseStream();
        setIsRecording(false);
        setIsPaused(false);
        resolve(null);
      }
    });
  }

  const discardRecording = useCallback((): void => {
    const recorder = recorderRef.current;
    cleanupAudio();
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = () => {
        releaseStream();
      };
      recorder.stop();
    } else {
      releaseStream();
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  return {
    isRecording,
    isPaused,
    elapsed,
    audioLevel,
    analyserNode,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    discardRecording,
  };
}
