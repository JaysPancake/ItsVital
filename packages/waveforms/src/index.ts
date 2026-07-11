export interface WaveformRenderer {
  clear(): void;
  render(samples: readonly number[]): void;
}

export interface SinusEcgSampleOptions {
  heartRate: number;
  timeSeconds: number;
}

const clampHeartRate = (heartRate: number) => Math.min(Math.max(heartRate, 20), 250);

const gaussian = (phase: number, center: number, width: number, amplitude: number) => {
  const distance = phase - center;

  return amplitude * Math.exp(-(distance * distance) / (2 * width * width));
};

export function sampleSinusEcg({ heartRate, timeSeconds }: SinusEcgSampleOptions): number {
  const safeHeartRate = clampHeartRate(Number.isFinite(heartRate) ? heartRate : 80);
  const safeTimeSeconds = Number.isFinite(timeSeconds) ? Math.max(0, timeSeconds) : 0;
  const beatDurationSeconds = 60 / safeHeartRate;
  const phase = (safeTimeSeconds % beatDurationSeconds) / beatDurationSeconds;

  const baseline = 0.03 * Math.sin(2 * Math.PI * safeTimeSeconds * 0.33);
  const pWave = gaussian(phase, 0.18, 0.035, 0.12);
  const qWave = gaussian(phase, 0.37, 0.012, -0.18);
  const rWave = gaussian(phase, 0.4, 0.01, 1);
  const sWave = gaussian(phase, 0.43, 0.014, -0.28);
  const tWave = gaussian(phase, 0.68, 0.07, 0.32);

  return baseline + pWave + qWave + rWave + sWave + tWave;
}

export function generateSinusEcgSamples(
  heartRate: number,
  startTimeSeconds: number,
  sampleRateHz: number,
  sampleCount: number,
): number[] {
  const safeSampleRate = Number.isFinite(sampleRateHz) && sampleRateHz > 0 ? sampleRateHz : 250;
  const safeSampleCount = Math.max(0, Math.floor(sampleCount));

  return Array.from({ length: safeSampleCount }, (_unused, index) =>
    sampleSinusEcg({
      heartRate,
      timeSeconds: startTimeSeconds + index / safeSampleRate,
    }),
  );
}
