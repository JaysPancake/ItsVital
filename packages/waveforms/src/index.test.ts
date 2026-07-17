import { describe, expect, it } from "vitest";
import {
  generateSinusEcgSamples,
  generateWaveformSamples,
  sampleCapnography,
  samplePleth,
  sampleSinusEcg,
  sampleSinusEcgEnvelope,
  sampleWaveformEnvelope,
} from "./index";

describe("waveforms package", () => {
  it("generates finite and bounded samples for every waveform", () => {
    const ecg = generateSinusEcgSamples(80, -2, 250, 500);
    const pleth = generateWaveformSamples(
      (timeSeconds) => samplePleth({ heartRate: 80, spo2: 98, timeSeconds }),
      -2,
      250,
      500,
    );
    const capnography = generateWaveformSamples(
      (timeSeconds) => sampleCapnography({ respiratoryRate: 16, etco2: 35, timeSeconds }),
      -2,
      250,
      500,
    );

    expect([...ecg, ...pleth, ...capnography].every(Number.isFinite)).toBe(true);
    expect(ecg.every((sample) => sample >= -1 && sample <= 1.1)).toBe(true);
    expect([...pleth, ...capnography].every((sample) => sample >= 0 && sample <= 1)).toBe(true);
  });

  it("keeps ECG and pleth timing stable across heart beats", () => {
    expect(sampleSinusEcg({ heartRate: 60, timeSeconds: 0.4 })).toBeCloseTo(
      sampleSinusEcg({ heartRate: 60, timeSeconds: 1.4 }),
      1,
    );
    expect(samplePleth({ heartRate: 60, spo2: 98, timeSeconds: 0.2 })).toBeCloseTo(
      samplePleth({ heartRate: 60, spo2: 98, timeSeconds: 1.2 }),
      5,
    );
  });

  it("keeps capnography timing stable across respiratory cycles", () => {
    const firstBreath = sampleCapnography({ respiratoryRate: 12, etco2: 40, timeSeconds: 2 });
    const secondBreath = sampleCapnography({ respiratoryRate: 12, etco2: 40, timeSeconds: 7 });

    expect(secondBreath).toBeCloseTo(firstBreath, 5);
  });

  it("returns flat capnography and pleth traces at safe zero boundaries", () => {
    expect(sampleCapnography({ respiratoryRate: 0, etco2: 35, timeSeconds: 1 })).toBe(0);
    expect(sampleCapnography({ respiratoryRate: 16, etco2: 0, timeSeconds: 1 })).toBe(0);
    expect(samplePleth({ heartRate: 80, spo2: 0, timeSeconds: 1 })).toBe(0);
  });

  it("guards invalid inputs and envelope samples from NaN and infinities", () => {
    const samples = [
      sampleSinusEcg({ heartRate: Number.NaN, timeSeconds: Number.POSITIVE_INFINITY }),
      samplePleth({ heartRate: Number.NaN, spo2: Number.NEGATIVE_INFINITY, timeSeconds: Number.NaN }),
      sampleCapnography({
        respiratoryRate: Number.NaN,
        etco2: Number.POSITIVE_INFINITY,
        timeSeconds: Number.NEGATIVE_INFINITY,
      }),
    ];
    const envelope = sampleWaveformEnvelope({
      sampler: () => Number.NaN,
      startTimeSeconds: Number.NaN,
      durationSeconds: -1,
      sampleCount: Number.POSITIVE_INFINITY,
    });

    expect(samples.every(Number.isFinite)).toBe(true);
    expect(envelope).toEqual({ min: 0, max: 0 });
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
