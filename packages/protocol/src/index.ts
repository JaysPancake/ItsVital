import { z } from "zod";

export const protocolVersion = 1;

export const rhythmSchema = z.literal("sinus");

export const vitalRanges = {
  heartRate: { min: 20, max: 250 },
  spo2: { min: 0, max: 100 },
  respiratoryRate: { min: 0, max: 80 },
  etco2: { min: 0, max: 100 },
  systolic: { min: 40, max: 260 },
  diastolic: { min: 20, max: 180 },
} as const;

const integerRange = (min: number, max: number) => z.number().int().min(min).max(max);

export const bloodPressureSchema = z
  .object({
    systolic: integerRange(vitalRanges.systolic.min, vitalRanges.systolic.max),
    diastolic: integerRange(vitalRanges.diastolic.min, vitalRanges.diastolic.max),
  })
  .refine((bloodPressure) => bloodPressure.systolic > bloodPressure.diastolic, {
    message: "Systolic pressure must be greater than diastolic pressure.",
    path: ["systolic"],
  });

export const patientStateSchema = z.object({
  heartRate: integerRange(vitalRanges.heartRate.min, vitalRanges.heartRate.max),
  spo2: integerRange(vitalRanges.spo2.min, vitalRanges.spo2.max),
  respiratoryRate: integerRange(
    vitalRanges.respiratoryRate.min,
    vitalRanges.respiratoryRate.max,
  ),
  etco2: integerRange(vitalRanges.etco2.min, vitalRanges.etco2.max),
  bloodPressure: bloodPressureSchema,
});

export const monitorStateSchema = z.object({
  rhythm: rhythmSchema,
});

export const sessionSnapshotSchema = z.object({
  protocolVersion: z.literal(protocolVersion),
  sessionId: z.string().uuid(),
  revision: z.number().int().nonnegative(),
  serverTime: z.string().datetime(),
  expiresAt: z.string().datetime(),
  patient: patientStateSchema,
  monitor: monitorStateSchema,
});

const vitalsPatchPayloadSchema = z
  .object({
    heartRate: patientStateSchema.shape.heartRate.optional(),
    spo2: patientStateSchema.shape.spo2.optional(),
    respiratoryRate: patientStateSchema.shape.respiratoryRate.optional(),
    etco2: patientStateSchema.shape.etco2.optional(),
  })
  .refine((payload) => Object.values(payload).some((value) => value !== undefined), {
    message: "At least one vital sign must be provided.",
  });

export const instructorCommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("vitals.patch"),
    payload: vitalsPatchPayloadSchema,
  }),
  z.object({
    type: z.literal("bloodPressure.set"),
    payload: bloodPressureSchema,
  }),
  z.object({
    type: z.literal("rhythm.set"),
    payload: z.object({ rhythm: rhythmSchema }),
  }),
]);

export const sessionCreateRequestSchema = z.object({
  protocolVersion: z.literal(protocolVersion),
});

export const instructorJoinRequestSchema = z.object({
  protocolVersion: z.literal(protocolVersion),
  role: z.literal("instructor"),
  sessionId: z.string().uuid(),
  instructorToken: z.string().min(1),
});

export const monitorJoinRequestSchema = z.object({
  protocolVersion: z.literal(protocolVersion),
  role: z.literal("monitor"),
  joinCode: z.string().min(4).max(12),
});

export const sessionJoinRequestSchema = z.discriminatedUnion("role", [
  instructorJoinRequestSchema,
  monitorJoinRequestSchema,
]);

export const sessionResyncRequestSchema = sessionJoinRequestSchema;

export const commandApplyRequestSchema = z.object({
  protocolVersion: z.literal(protocolVersion),
  sessionId: z.string().uuid(),
  instructorToken: z.string().min(1),
  command: instructorCommandSchema,
});

export type Rhythm = z.infer<typeof rhythmSchema>;
export type BloodPressure = z.infer<typeof bloodPressureSchema>;
export type PatientState = z.infer<typeof patientStateSchema>;
export type MonitorState = z.infer<typeof monitorStateSchema>;
export type SessionSnapshot = z.infer<typeof sessionSnapshotSchema>;
export type InstructorCommand = z.infer<typeof instructorCommandSchema>;
export type SessionCreateRequest = z.infer<typeof sessionCreateRequestSchema>;
export type SessionJoinRequest = z.infer<typeof sessionJoinRequestSchema>;
export type SessionResyncRequest = z.infer<typeof sessionResyncRequestSchema>;
export type CommandApplyRequest = z.infer<typeof commandApplyRequestSchema>;

export type ProtocolErrorCode =
  | "expired"
  | "forbidden"
  | "invalid_payload"
  | "not_found"
  | "protocol_mismatch";

export interface ProtocolError {
  code: ProtocolErrorCode;
  message: string;
}

export type SessionCreateResult =
  | {
      ok: true;
      sessionId: string;
      joinCode: string;
      instructorToken: string;
      snapshot: SessionSnapshot;
    }
  | { ok: false; error: ProtocolError };

export type SessionJoinResult =
  | {
      ok: true;
      role: "instructor" | "monitor";
      snapshot: SessionSnapshot;
    }
  | { ok: false; error: ProtocolError };

export type CommandApplyResult =
  | { ok: true; snapshot: SessionSnapshot }
  | { ok: false; error: ProtocolError };

export interface ServerToClientEvents {
  "session:snapshot": (snapshot: SessionSnapshot) => void;
  "session:expired": (sessionId: string) => void;
}

export interface ClientToServerEvents {
  "session:create": (
    request: SessionCreateRequest,
    acknowledge: (result: SessionCreateResult) => void,
  ) => void;
  "session:join": (
    request: SessionJoinRequest,
    acknowledge: (result: SessionJoinResult) => void,
  ) => void;
  "session:resync": (
    request: SessionResyncRequest,
    acknowledge: (result: SessionJoinResult) => void,
  ) => void;
  "command:apply": (
    request: CommandApplyRequest,
    acknowledge: (result: CommandApplyResult) => void,
  ) => void;
}
