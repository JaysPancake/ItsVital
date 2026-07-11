import { useEffect, useRef } from "react";
import { sampleSinusEcgEnvelope } from "@itsvital/waveforms";

interface WaveformCanvasProps {
  heartRate: number;
}

export function WaveformCanvas({ heartRate }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heartRateRef = useRef(heartRate);

  useEffect(() => {
    heartRateRef.current = heartRate;
  }, [heartRate]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    let animationFrameId = 0;
    const startedAt = performance.now();

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const scale = window.devicePixelRatio || 1;
      const targetWidth = Math.max(1, Math.floor(width * scale));
      const targetHeight = Math.max(1, Math.floor(height * scale));

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#07110f";
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "rgba(28, 184, 122, 0.18)";
      context.lineWidth = 1;

      for (let x = 0; x < width; x += 24) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }

      for (let y = 0; y < height; y += 24) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      context.strokeStyle = "#2bf78f";
      context.lineWidth = 2;
      context.beginPath();

      const elapsedSeconds = (performance.now() - startedAt) / 1000;
      const secondsAcrossCanvas = 4;
      const secondsPerPixel = secondsAcrossCanvas / width;

      for (let x = 0; x < width; x += 1) {
        const timeSeconds = elapsedSeconds - secondsAcrossCanvas + x * secondsPerPixel;
        const envelope = sampleSinusEcgEnvelope({
          heartRate: heartRateRef.current,
          startTimeSeconds: timeSeconds,
          durationSeconds: secondsPerPixel,
          sampleCount: 10,
        });
        const minY = height * 0.55 - envelope.min * height * 0.32;
        const maxY = height * 0.55 - envelope.max * height * 0.32;

        if (x === 0) {
          context.moveTo(x, minY);
        } else {
          context.lineTo(x, minY);
        }

        context.lineTo(x, maxY);
      }

      context.stroke();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="waveform" aria-label="Sinus ECG waveform" />;
}
