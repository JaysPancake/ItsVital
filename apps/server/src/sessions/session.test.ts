import { describe, expect, it } from "vitest";
import {
  applyInstructorCommand,
  createSessionResult,
  createSimulationSession,
  instructorJoinResult,
  isExpired,
  sessionTtlMs,
} from "./session";
import { InMemorySessionStore } from "../stores/InMemorySessionStore";

describe("session domain", () => {
  it("creates a session with distinct monitor and instructor credentials", async () => {
    const result = await createSessionResult(new InMemorySessionStore(), new Date("2026-07-11T12:00:00.000Z"));

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.joinCode).toHaveLength(6);
      expect(result.instructorToken).not.toBe(result.joinCode);
      expect(result.snapshot.patient.heartRate).toBe(80);
      expect(result.snapshot.monitor.controlMode).toBe("instructor-managed");
      expect(result.snapshot.revision).toBe(0);
    }
  });

  it("rejects instructor access with the public join code", () => {
    const session = createSimulationSession();
    const result = instructorJoinResult(session, session.joinCode);

    expect(result).toEqual({
      ok: false,
      error: { code: "forbidden", message: "Instructor credential is invalid." },
    });
  });

  it("increments revision and updates snapshots for accepted commands", () => {
    const now = new Date("2026-07-11T12:00:00.000Z");
    const session = createSimulationSession(now);
    const result = applyInstructorCommand(
      session,
      session.instructorToken,
      { type: "vitals.patch", payload: { heartRate: 102 } },
      now,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.snapshot.revision).toBe(1);
      expect(result.snapshot.patient.heartRate).toBe(102);
    }
  });

  it("authorizes and applies monitor control mode changes", () => {
    const session = createSimulationSession();
    const result = applyInstructorCommand(session, session.instructorToken, {
      type: "monitor.controlMode.set",
      payload: { controlMode: "student-operated" },
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.snapshot.monitor.controlMode).toBe("student-operated");
      expect(result.snapshot.revision).toBe(1);
    }
  });

  it("identifies expired sessions", () => {
    const now = new Date("2026-07-11T12:00:00.000Z");
    const session = createSimulationSession(now);

    expect(isExpired(session, new Date(now.getTime() + sessionTtlMs - 1))).toBe(false);
    expect(isExpired(session, new Date(now.getTime() + sessionTtlMs))).toBe(true);
  });
});
