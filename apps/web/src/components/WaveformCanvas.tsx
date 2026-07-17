import { useEffect, useRef } from "react";
import type { WaveformSampler } from "@itsvital/waveforms";
import { CanvasWaveformRenderer } from "./CanvasWaveformRenderer";

interface WaveformCanvasProps {
  active: boolean;
  baselineRatio?: number;
  color: string;
  gain: number;
  label: string;
  sampler: WaveformSampler;
  showGrid: boolean;
  sweepSpeed: number;
  testId: string;
}

export function WaveformCanvas({
  active,
  baselineRatio = 0.7,
  color,
  gain,
  label,
  sampler,
  showGrid,
  sweepSpeed,
  testId,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const samplerRef = useRef(sampler);
  const optionsRef = useRef({ active, baselineRatio, color, gain, showGrid, sweepSpeed });

  useEffect(() => {
    samplerRef.current = sampler;
    optionsRef.current = { active, baselineRatio, color, gain, showGrid, sweepSpeed };
  }, [active, baselineRatio, color, gain, sampler, showGrid, sweepSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    let renderer: CanvasWaveformRenderer;

    try {
      renderer = new CanvasWaveformRenderer(canvas);
    } catch {
      return;
    }

    let animationFrameId = 0;
    const startedAt = performance.now();

    const render = () => {
      const elapsedSeconds = (performance.now() - startedAt) / 1000;
      renderer.setOptions({ ...optionsRef.current, elapsedSeconds, sampler: samplerRef.current });
      renderer.render(samplerRef.current, elapsedSeconds);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="waveform"
      data-testid={testId}
      aria-label={`${label} waveform${active ? "" : ", unavailable"}`}
    />
  );
}
