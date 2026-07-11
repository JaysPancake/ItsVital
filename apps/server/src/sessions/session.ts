import { randomBytes, randomUUID } from "node:crypto";
import {
  type CommandApplyResult,
  type InstructorCommand,
  type PatientState,
  protocolVersion,
  type SessionCreateResult,
  type SessionJoinResult,
  type SessionSnapshot,
} from "@itsvital/protocol";

export const sessionTtlMs = 30 * 60 * 1000;

export interface SimulationSession {
  sessionId: string;
  joinCode: string;
  instructorToken: string;
  revision: number;
  expiresAt: Date;
  patient: PatientState;
  monitor: {
    rhythm: "sinus";
  };
}

export interface SessionStore {
  create(session: SimulationSession): Promise<void>;
  get(id: string): Promise<SimulationSession | null>;
  getByJoinCode(joinCode: string): Promise<SimulationSession | null>;
  update(session: SimulationSession): Promise<void>;
  delete(id: string): Promise<void>;
  list(): Promise<SimulationSession[]>;
}

export const defaultPatientState: PatientState = {
  heartRate: 80,
  spo2: 98,
  respiratoryRate: 16,
  etco2: 35,
  bloodPressure: { systolic: 120, diastolic: 80 },
};

const createDefaultPatientState = (): PatientState => ({
  ...defaultPatientState,
  bloodPressure: { ...defaultPatientState.bloodPressure },
});

const joinCodeAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateJoinCode(length = 6): string {
  const bytes = randomBytes(length);

  return Array.from(bytes, (byte) => joinCodeAlphabet[byte % joinCodeAlphabet.length]).join("");
}

export function generateInstructorToken(): string {
  return randomBytes(32).toString("base64url");
}

export function createSimulationSession(now = new Date()): SimulationSession {
  return {
    sessionId: randomUUID(),
    joinCode: generateJoinCode(),
    instructorToken: generateInstructorToken(),
    revision: 0,
    expiresAt: new Date(now.getTime() + sessionTtlMs),
    patient: createDefaultPatientState(),
    monitor: { rhythm: "sinus" },
  };
}

export function snapshotSession(session: SimulationSession, now = new Date()): SessionSnapshot {
  return {
    protocolVersion,
    sessionId: session.sessionId,
    revision: session.revision,
    serverTime: now.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    patient: session.patient,
    monitor: session.monitor,
  };
}

export function isExpired(session: SimulationSession, now = new Date()): boolean {
  return session.expiresAt.getTime() <= now.getTime();
}

export function applyInstructorCommand(
  session: SimulationSession,
  instructorToken: string,
  command: InstructorCommand,
  now = new Date(),
): CommandApplyResult {
  if (isExpired(session, now)) {
    return { ok: false, error: { code: "expired", message: "Session has expired." } };
  }

  if (session.instructorToken !== instructorToken) {
    return { ok: false, error: { code: "forbidden", message: "Instructor credential is invalid." } };
  }

  const patient = { ...session.patient, bloodPressure: { ...session.patient.bloodPressure } };
  const monitor = { ...session.monitor };

  switch (command.type) {
    case "vitals.patch":
      session.patient = { ...patient, ...command.payload };
      break;
    case "bloodPressure.set":
      session.patient = { ...patient, bloodPressure: command.payload };
      break;
    case "rhythm.set":
      session.monitor = { ...monitor, rhythm: command.payload.rhythm };
      break;
  }

  session.revision += 1;
  session.expiresAt = new Date(now.getTime() + sessionTtlMs);

  return { ok: true, snapshot: snapshotSession(session, now) };
}

export async function createSessionResult(
  store: SessionStore,
  now = new Date(),
): Promise<SessionCreateResult> {
  let session = createSimulationSession(now);

  while (await store.getByJoinCode(session.joinCode)) {
    session = createSimulationSession(now);
  }

  await store.create(session);

  return {
    ok: true,
    sessionId: session.sessionId,
    joinCode: session.joinCode,
    instructorToken: session.instructorToken,
    snapshot: snapshotSession(session, now),
  };
}

export function instructorJoinResult(
  session: SimulationSession | null,
  instructorToken: string,
  now = new Date(),
): SessionJoinResult {
  if (!session) {
    return { ok: false, error: { code: "not_found", message: "Session was not found." } };
  }

  if (isExpired(session, now)) {
    return { ok: false, error: { code: "expired", message: "Session has expired." } };
  }

  if (session.instructorToken !== instructorToken) {
    return { ok: false, error: { code: "forbidden", message: "Instructor credential is invalid." } };
  }

  return { ok: true, role: "instructor", snapshot: snapshotSession(session, now) };
}

export function monitorJoinResult(
  session: SimulationSession | null,
  now = new Date(),
): SessionJoinResult {
  if (!session) {
    return { ok: false, error: { code: "not_found", message: "Session was not found." } };
  }

  if (isExpired(session, now)) {
    return { ok: false, error: { code: "expired", message: "Session has expired." } };
  }

  return { ok: true, role: "monitor", snapshot: snapshotSession(session, now) };
}
