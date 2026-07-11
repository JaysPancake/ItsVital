import { describe, expect, it } from "vitest";
import {
  instructorCommandSchema,
  protocolVersion,
  sessionSnapshotSchema,
  vitalRanges,
} from "./index";

describe("protocolVersion", () => {
  it("is a positive integer", () => {
    expect(Number.isInteger(protocolVersion)).toBe(true);
    expect(protocolVersion).toBeGreaterThan(0);
  });
});

describe("instructorCommandSchema", () => {
  it("accepts valid vital sign patches", () => {
    const result = instructorCommandSchema.safeParse({
      type: "vitals.patch",
      payload: { heartRate: 96, spo2: 94, respiratoryRate: 20, etco2: 38 },
    });

    expect(result.success).toBe(true);
  });

  it("rejects out-of-range vital sign patches", () => {
    const result = instructorCommandSchema.safeParse({
      type: "vitals.patch",
      payload: { heartRate: vitalRanges.heartRate.max + 1 },
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty vital sign patches", () => {
    const result = instructorCommandSchema.safeParse({
      type: "vitals.patch",
      payload: {},
    });

    expect(result.success).toBe(false);
  });

  it("requires systolic pressure to be greater than diastolic pressure", () => {
    const result = instructorCommandSchema.safeParse({
      type: "bloodPressure.set",
      payload: { systolic: 80, diastolic: 120 },
    });

    expect(result.success).toBe(false);
  });
});

describe("sessionSnapshotSchema", () => {
  it("accepts a complete v0.0.1 session snapshot", () => {
    const result = sessionSnapshotSchema.safeParse({
      protocolVersion,
      sessionId: "7d98be1d-9028-41b4-95aa-c51f4e95f503",
      revision: 1,
      serverTime: "2026-07-11T12:00:00.000Z",
      expiresAt: "2026-07-11T12:30:00.000Z",
      patient: {
        heartRate: 80,
        spo2: 98,
        respiratoryRate: 16,
        etco2: 35,
        bloodPressure: { systolic: 120, diastolic: 80 },
      },
      monitor: { rhythm: "sinus" },
    });

    expect(result.success).toBe(true);
  });
});
