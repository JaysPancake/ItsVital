import { describe, expect, it } from "vitest";
import { generateSinusEcgSamples, sampleSinusEcg, sampleSinusEcgEnvelope } from "./index";

describe("waveforms package", () => {
  it("generates finite sinus ECG samples", () => {
    const samples = generateSinusEcgSamples(80, 0, 250, 500);

    expect(samples).toHaveLength(500);
    expect(samples.every(Number.isFinite)).toBe(true);
  });

  it("keeps sinus ECG timing stable for the same phase", () => {
    const firstBeat = sampleSinusEcg({ heartRate: 60, timeSeconds: 0.4 });
    const secondBeat = sampleSinusEcg({ heartRate: 60, timeSeconds: 1.4 });

    expect(secondBeat).toBeCloseTo(firstBeat, 1);
  });

  it("guards against invalid input without returning NaN or infinities", () => {
    const sample = sampleSinusEcg({ heartRate: Number.NaN, timeSeconds: Number.POSITIVE_INFINITY });

    expect(Number.isFinite(sample)).toBe(true);
  });

  it("captures stable high-rate QRS peaks across adjacent render offsets", () => {
    const heartRate = 180;
    const beatDurationSeconds = 60 / heartRate;
    const qrsPeakSeconds = beatDurationSeconds * 0.4;
    const pixelDurationSeconds = 4 / 900;
    const firstColumn = sampleSinusEcgEnvelope({
      heartRate,
      startTimeSeconds: qrsPeakSeconds - pixelDurationSeconds / 2,
      durationSeconds: pixelDurationSeconds,
      sampleCount: 12,
    });
    const offsetColumn = sampleSinusEcgEnvelope({
      heartRate,
      startTimeSeconds: qrsPeakSeconds - pixelDurationSeconds / 2 + pixelDurationSeconds / 3,
      durationSeconds: pixelDurationSeconds,
      sampleCount: 12,
    });

    expect(firstColumn.max).toBeGreaterThan(0.9);
    expect(offsetColumn.max).toBeGreaterThan(0.9);
    expect(Math.abs(firstColumn.max - offsetColumn.max)).toBeLessThan(0.08);
  });
});
