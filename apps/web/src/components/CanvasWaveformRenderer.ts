import { sampleWaveformEnvelope, type WaveformRenderer, type WaveformSampler } from "@itsvital/waveforms";

export interface CanvasRenderOptions {
  active: boolean;
  baselineRatio: number;
  color: string;
  elapsedSeconds: number;
  gain: number;
  showGrid: boolean;
  sampler: WaveformSampler;
  sweepSpeed: number;
}

export class CanvasWaveformRenderer implements WaveformRenderer {
  readonly #canvas: HTMLCanvasElement;
  readonly #context: CanvasRenderingContext2D;
  #options: CanvasRenderOptions | null = null;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D is unavailable.");
    }

    this.#canvas = canvas;
    this.#context = context;
  }

  setOptions(options: CanvasRenderOptions) {
    this.#options = options;
  }

  clear() {
    const width = this.#canvas.clientWidth;
    const height = this.#canvas.clientHeight;
    this.#context.clearRect(0, 0, width, height);
  }

  render(sampler: WaveformSampler, elapsedSeconds: number) {
    if (!this.#options) {
      return;
    }

    const width = this.#canvas.clientWidth;
    const height = this.#canvas.clientHeight;

    if (width <= 0 || height <= 0) {
      return;
    }

    const scale = window.devicePixelRatio || 1;
    const targetWidth = Math.max(1, Math.floor(width * scale));
    const targetHeight = Math.max(1, Math.floor(height * scale));

    if (this.#canvas.width !== targetWidth || this.#canvas.height !== targetHeight) {
      this.#canvas.width = targetWidth;
      this.#canvas.height = targetHeight;
    }

    const options = { ...this.#options, sampler, elapsedSeconds };
    const context = this.#context;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#050908";
    context.fillRect(0, 0, width, height);

    if (options.showGrid) {
      this.#drawGrid(width, height, options.sweepSpeed);
    }

    const baselineY = height * options.baselineRatio;

    if (!options.active) {
      context.strokeStyle = "rgba(157, 171, 165, 0.5)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(0, baselineY);
      context.lineTo(width, baselineY);
      context.stroke();
      return;
    }

    const secondsAcrossCanvas = 100 / options.sweepSpeed;
    const secondsPerPixel = secondsAcrossCanvas / width;
    const amplitude = height * 0.36 * options.gain;
    context.save();
    context.beginPath();
    context.rect(0, 0, width, height);
    context.clip();
    context.strokeStyle = options.color;
    context.lineWidth = 2;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.beginPath();

    for (let x = 0; x < width; x += 1) {
      const startTimeSeconds = options.elapsedSeconds - secondsAcrossCanvas + x * secondsPerPixel;
      const envelope = sampleWaveformEnvelope({
        sampler: options.sampler,
        startTimeSeconds,
        durationSeconds: secondsPerPixel,
        sampleCount: 8,
      });
      const midpoint = (envelope.min + envelope.max) / 2;
      const strongest = Math.abs(envelope.max) >= Math.abs(envelope.min) ? envelope.max : envelope.min;
      const value = envelope.max - envelope.min > 0.06 ? strongest : midpoint;
      const y = baselineY - value * amplitude;

      if (x === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.stroke();
    context.restore();
  }

  #drawGrid(width: number, height: number, sweepSpeed: number) {
    const context = this.#context;
    const secondsAcrossCanvas = 100 / sweepSpeed;
    const horizontalSpacing = Math.max(12, width / (secondsAcrossCanvas / 0.2));
    const verticalSpacing = 20;
    context.strokeStyle = "rgba(83, 111, 100, 0.22)";
    context.lineWidth = 1;

    for (let x = 0; x <= width; x += horizontalSpacing) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }

    for (let y = 0; y <= height; y += verticalSpacing) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
  }
}
