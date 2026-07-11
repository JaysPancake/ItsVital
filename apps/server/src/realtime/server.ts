import type { Server } from "socket.io";
import {
  commandApplyRequestSchema,
  type ClientToServerEvents,
  type CommandApplyResult,
  sessionCreateRequestSchema,
  type ServerToClientEvents,
  sessionJoinRequestSchema,
} from "@itsvital/protocol";
import {
  applyInstructorCommand,
  createSessionResult,
  instructorJoinResult,
  isExpired,
  monitorJoinResult,
  type SessionStore,
} from "../sessions/session.js";

export interface RealtimeServerOptions {
  cleanupIntervalMs?: number;
  now?: () => Date;
}

const roomForSession = (sessionId: string) => `session:${sessionId}`;

const invalidPayload = (message = "Payload is invalid.") => ({
  ok: false as const,
  error: { code: "invalid_payload" as const, message },
});

export async function expireSessions(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  store: SessionStore,
  now = new Date(),
): Promise<string[]> {
  const expiredSessionIds: string[] = [];

  for (const session of await store.list()) {
    if (isExpired(session, now)) {
      expiredSessionIds.push(session.sessionId);
      io.to(roomForSession(session.sessionId)).emit("session:expired", session.sessionId);
      await store.delete(session.sessionId);
    }
  }

  return expiredSessionIds;
}

export function attachRealtimeServer(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  store: SessionStore,
  options: RealtimeServerOptions = {},
): () => void {
  const now = options.now ?? (() => new Date());
  const cleanupInterval = setInterval(() => {
    void expireSessions(io, store, now());
  }, options.cleanupIntervalMs ?? 30_000);

  io.on("connection", (socket) => {
    socket.on("session:create", async (request, acknowledge) => {
      const parsedRequest = sessionCreateRequestSchema.safeParse(request);

      if (!parsedRequest.success) {
        acknowledge(invalidPayload("Session create request is invalid."));
        return;
      }

      const result = await createSessionResult(store, now());

      if (result.ok) {
        await socket.join(roomForSession(result.sessionId));
      }

      acknowledge(result);
    });

    socket.on("session:join", async (request, acknowledge) => {
      const parsedRequest = sessionJoinRequestSchema.safeParse(request);

      if (!parsedRequest.success) {
        acknowledge(invalidPayload("Session join request is invalid."));
        return;
      }

      const joinRequest = parsedRequest.data;
      const session =
        joinRequest.role === "instructor"
          ? await store.get(joinRequest.sessionId)
          : await store.getByJoinCode(joinRequest.joinCode);
      const result =
        joinRequest.role === "instructor"
          ? instructorJoinResult(session, joinRequest.instructorToken, now())
          : monitorJoinResult(session, now());

      if (result.ok) {
        await socket.join(roomForSession(result.snapshot.sessionId));
        socket.emit("session:snapshot", result.snapshot);
      }

      acknowledge(result);
    });

    socket.on("session:resync", async (request, acknowledge) => {
      const parsedRequest = sessionJoinRequestSchema.safeParse(request);

      if (!parsedRequest.success) {
        acknowledge(invalidPayload("Session resync request is invalid."));
        return;
      }

      const resyncRequest = parsedRequest.data;
      const session =
        resyncRequest.role === "instructor"
          ? await store.get(resyncRequest.sessionId)
          : await store.getByJoinCode(resyncRequest.joinCode);
      const result =
        resyncRequest.role === "instructor"
          ? instructorJoinResult(session, resyncRequest.instructorToken, now())
          : monitorJoinResult(session, now());

      if (result.ok) {
        await socket.join(roomForSession(result.snapshot.sessionId));
        socket.emit("session:snapshot", result.snapshot);
      }

      acknowledge(result);
    });

    socket.on("command:apply", async (request, acknowledge) => {
      const parsedRequest = commandApplyRequestSchema.safeParse(request);

      if (!parsedRequest.success) {
        acknowledge(invalidPayload("Command request is invalid.") satisfies CommandApplyResult);
        return;
      }

      const commandRequest = parsedRequest.data;
      const session = await store.get(commandRequest.sessionId);

      if (!session) {
        acknowledge({
          ok: false,
          error: { code: "not_found", message: "Session was not found." },
        });
        return;
      }

      const result = applyInstructorCommand(
        session,
        commandRequest.instructorToken,
        commandRequest.command,
        now(),
      );

      if (result.ok) {
        await store.update(session);
        io.to(roomForSession(session.sessionId)).emit("session:snapshot", result.snapshot);
      }

      acknowledge(result);
    });
  });

  return () => {
    clearInterval(cleanupInterval);
  };
}
