export interface WaveformEnvelope {
  min: number;
  max: number;
}

export type WaveformSampler = (timeSeconds: number) => number;

export interface WaveformRenderer {
  clear(): void;
  render(sampler: WaveformSampler, elapsedSeconds: number): void;
}

export interface SinusEcgSampleOptions {
  heartRate: number;
  timeSeconds: number;
}

export interface PlethSampleOptions extends SinusEcgSampleOptions {
  spo2: number;
}

export interface CapnographySampleOptions {
  respiratoryRate: number;
  etco2: number;
  timeSeconds: number;
}

export interface WaveformEnvelopeOptions {
  sampler: WaveformSampler;
  startTimeSeconds: number;
  durationSeconds: number;
  sampleCount?: number;
}

export interface SinusEcgEnvelopeOptions {
  heartRate: number;
  startTimeSeconds: number;
  durationSeconds: number;
  sampleCount?: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const finiteOr = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);
const positiveModulo = (value: number, modulus: number) => ((value % modulus) + modulus) % modulus;

const gaussian = (phase: number, center: number, width: number, amplitude: number) => {
  const distance = phase - center;

  return amplitude * Math.exp(-(distance * distance) / (2 * width * width));
};

const smoothstep = (value: number) => {
  const clamped = clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
};

export function sampleSinusEcg({ heartRate, timeSeconds }: SinusEcgSampleOptions): number {
  const safeHeartRate = clamp(finiteOr(heartRate, 80), 20, 250);
  const safeTimeSeconds = finiteOr(timeSeconds, 0);
  const beatDurationSeconds = 60 / safeHeartRate;
  const phase = positiveModulo(safeTimeSeconds, beatDurationSeconds) / beatDurationSeconds;

  const baseline = 0.025 * Math.sin(2 * Math.PI * safeTimeSeconds * 0.33);
  const pWave = gaussian(phase, 0.18, 0.035, 0.12);
  const qWave = gaussian(phase, 0.37, 0.012, -0.18);
  const rWave = gaussian(phase, 0.4, 0.01, 1);
  const sWave = gaussian(phase, 0.43, 0.014, -0.28);
  const tWave = gaussian(phase, 0.68, 0.07, 0.32);

  return clamp(baseline + pWave + qWave + rWave + sWave + tWave, -1, 1.1);
}

export function samplePleth({ heartRate, spo2, timeSeconds }: PlethSampleOptions): number {
  const safeSpo2 = clamp(finiteOr(spo2, 98), 0, 100);

  if (safeSpo2 === 0) {
    return 0;
  }

  const safeHeartRate = clamp(finiteOr(heartRate, 80), 20, 250);
  const safeTimeSeconds = finiteOr(timeSeconds, 0);
  const beatDurationSeconds = 60 / safeHeartRate;
  const phase = positiveModulo(safeTimeSeconds, beatDurationSeconds) / beatDurationSeconds;
  const pulse = Math.pow(phase, 2) * Math.exp(-8 * phase) * 118;
  const dicroticWave = gaussian(phase, 0.42, 0.045, 0.14);
  const perfusionScale = 0.35 + 0.65 * (safeSpo2 / 100);

  return clamp((pulse + dicroticWave) * perfusionScale, 0, 1);
}

export function sampleCapnography({
  respiratoryRate,
  etco2,
  timeSeconds,
}: CapnographySampleOptions): number {
  const safeRespiratoryRate = clamp(finiteOr(respiratoryRate, 16), 0, 80);
  const safeEtco2 = clamp(finiteOr(etco2, 35), 0, 100);

  if (safeRespiratoryRate === 0 || safeEtco2 === 0) {
    return 0;
  }

  const safeTimeSeconds = finiteOr(timeSeconds, 0);
  const breathDurationSeconds = 60 / safeRespiratoryRate;
  const phase = positiveModulo(safeTimeSeconds, breathDurationSeconds) / breathDurationSeconds;
  let shape = 0;

  if (phase >= 0.18 && phase < 0.28) {
    shape = smoothstep((phase - 0.18) / 0.1);
  } else if (phase >= 0.28 && phase < 0.68) {
    shape = 0.92 + 0.08 * ((phase - 0.28) / 0.4);
  } else if (phase >= 0.68 && phase < 0.76) {
    shape = 1 - smoothstep((phase - 0.68) / 0.08);
  }

  return clamp(shape * (safeEtco2 / 100), 0, 1);
}

export function sampleWaveformEnvelope({
  sampler,
  startTimeSeconds,
  durationSeconds,
  sampleCount = 8,
}: WaveformEnvelopeOptions): WaveformEnvelope {
  const safeStartTimeSeconds = finiteOr(startTimeSeconds, 0);
  const safeDurationSeconds =
    Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 1 / 250;
  const safeSampleCount = Math.max(2, Math.floor(finiteOr(sampleCount, 8)));
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < safeSampleCount; index += 1) {
    const fraction = index / (safeSampleCount - 1);
    const rawSample = sampler(safeStartTimeSeconds + safeDurationSeconds * fraction);
    const sample = finiteOr(rawSample, 0);
    min = Math.min(min, sample);
    max = Math.max(max, sample);
  }

  return { min, max };
}

export function generateWaveformSamples(
  sampler: WaveformSampler,
  startTimeSeconds: number,
  sampleRateHz: number,
  sampleCount: number,
): number[] {
  const safeStartTimeSeconds = finiteOr(startTimeSeconds, 0);
  const safeSampleRate = Number.isFinite(sampleRateHz) && sampleRateHz > 0 ? sampleRateHz : 250;
  const safeSampleCount = Math.max(0, Math.floor(finiteOr(sampleCount, 0)));

  return Array.from({ length: safeSampleCount }, (_unused, index) =>
    finiteOr(sampler(safeStartTimeSeconds + index / safeSampleRate), 0),
  );
}

export function generateSinusEcgSamples(
  heartRate: number,
  startTimeSeconds: number,
  sampleRateHz: number,
  sampleCount: number,
): number[] {
  return generateWaveformSamples(
    (timeSeconds) => sampleSinusEcg({ heartRate, timeSeconds }),
    startTimeSeconds,
    sampleRateHz,
    sampleCount,
  );
}

export function sampleSinusEcgEnvelope({
  heartRate,
  startTimeSeconds,
  durationSeconds,
  sampleCount,
}: SinusEcgEnvelopeOptions): WaveformEnvelope {
  return sampleWaveformEnvelope({
    sampler: (timeSeconds) => sampleSinusEcg({ heartRate, timeSeconds }),
    startTimeSeconds,
    durationSeconds,
    sampleCount,
  });
}
