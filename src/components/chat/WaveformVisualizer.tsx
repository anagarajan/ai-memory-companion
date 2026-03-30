import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  mode: "live" | "static";
  analyserNode?: AnalyserNode | null;
  /** Static bar heights (0–1) to render in static mode */
  bars?: readonly number[];
  /** 0–1 playback progress for static mode */
  playbackProgress?: number;
  color?: string;
  playedColor?: string;
  barWidth?: number;
  barGap?: number;
  height?: number;
  className?: string;
}

export function WaveformVisualizer({
  mode,
  analyserNode,
  bars,
  playbackProgress = 0,
  color = "#8E8E93",
  playedColor = "#5856D6",
  barWidth = 3,
  barGap = 2,
  height = 32,
  className,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High-DPI support
    const dpr = window.devicePixelRatio || 1;

    function resize(): void {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx!.scale(dpr, dpr);
    }
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    if (mode === "live" && analyserNode) {
      const bufferLength = analyserNode.frequencyBinCount;
      const data = new Uint8Array(bufferLength);

      function drawLive(): void {
        if (!canvas || !ctx) return;
        const w = canvas.getBoundingClientRect().width;
        const h = height;

        analyserNode!.getByteFrequencyData(data);
        ctx.clearRect(0, 0, w, h);

        const step = barWidth + barGap;
        const barCount = Math.floor(w / step);
        const binStep = Math.max(1, Math.floor(bufferLength / barCount));

        for (let i = 0; i < barCount; i++) {
          const binIndex = Math.min(i * binStep, bufferLength - 1);
          const value = data[binIndex] / 255;
          const barH = Math.max(2, value * h * 0.9);
          const x = i * step;
          const y = (h - barH) / 2;

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, barWidth / 2);
          ctx.fill();
        }

        rafRef.current = requestAnimationFrame(drawLive);
      }
      drawLive();
    } else if (mode === "static" && bars && bars.length > 0) {
      function drawStatic(): void {
        if (!canvas || !ctx) return;
        const w = canvas.getBoundingClientRect().width;
        const h = height;

        ctx.clearRect(0, 0, w, h);

        const step = barWidth + barGap;
        const barCount = Math.floor(w / step);
        const sampleStep = bars!.length / barCount;
        const progressIndex = Math.floor(playbackProgress * barCount);

        for (let i = 0; i < barCount; i++) {
          const sampleIdx = Math.min(Math.floor(i * sampleStep), bars!.length - 1);
          const value = bars![sampleIdx];
          const barH = Math.max(2, value * h * 0.85);
          const x = i * step;
          const y = (h - barH) / 2;

          ctx.fillStyle = i <= progressIndex ? playedColor : color;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, barWidth / 2);
          ctx.fill();
        }
      }
      drawStatic();
    }

    return () => {
      observer.disconnect();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [mode, analyserNode, bars, playbackProgress, color, playedColor, barWidth, barGap, height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height, display: "block" }}
    />
  );
}
