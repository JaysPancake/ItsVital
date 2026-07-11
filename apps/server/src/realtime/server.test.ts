import { createServer, type Server as HttpServer } from "node:http";
import { AddressInfo } from "node:net";
import { Server } from "socket.io";
import { io as createClientSocket, type Socket as ClientSocket } from "socket.io-client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type ClientToServerEvents,
  type CommandApplyResult,
  type CommandApplyRequest,
  protocolVersion,
  type ServerToClientEvents,
  type SessionCreateResult,
  type SessionCreateRequest,
  type SessionJoinRequest,
  type SessionJoinResult,
  type SessionSnapshot,
} from "@itsvital/protocol";
import { attachRealtimeServer, expireSessions } from "./server";
import { InMemorySessionStore } from "../stores/InMemorySessionStore";
import { createSimulationSession, sessionTtlMs } from "../sessions/session";

type TestClientSocket = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

const createSession = (socket: TestClientSocket, request: SessionCreateRequest) =>
  new Promise<SessionCreateResult>((resolve) => {
    socket.emit("session:create", request, resolve);
  });

const joinSession = (socket: TestClientSocket, request: SessionJoinRequest) =>
  new Promise<SessionJoinResult>((resolve) => {
    socket.emit("session:join", request, resolve);
  });

const resyncSession = (socket: TestClientSocket, request: SessionJoinRequest) =>
  new Promise<SessionJoinResult>((resolve) => {
    socket.emit("session:resync", request, resolve);
  });

const applyCommand = (socket: TestClientSocket, request: CommandApplyRequest) =>
  new Promise<CommandApplyResult>((resolve) => {
    socket.emit("command:apply", request, resolve);
  });

describe("realtime server", () => {
  let httpServer: HttpServer;
  let ioServer: Server<ClientToServerEvents, ServerToClientEvents>;
  let store: InMemorySessionStore;
  let cleanupRealtimeServer: () => void;
  let url: string;
  const sockets: TestClientSocket[] = [];

  beforeEach(async () => {
    httpServer = createServer();
    ioServer = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);
    store = new InMemorySessionStore();
    cleanupRealtimeServer = attachRealtimeServer(ioServer, store, { cleanupIntervalMs: 60_000 });

    await new Promise<void>((resolve) => {
      httpServer.listen(0, "127.0.0.1", resolve);
    });

    const address = httpServer.address() as AddressInfo;
    url = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    for (const socket of sockets) {
      socket.disconnect();
    }

    sockets.length = 0;
    cleanupRealtimeServer();

    await new Promise<void>((resolve) => {
      ioServer.close(() => resolve());
    });
  });

  const connect = async () => {
    const socket: TestClientSocket = createClientSocket(url);
    sockets.push(socket);
    await new Promise<void>((resolve) => {
      socket.on("connect", () => resolve());
    });

    return socket;
  };

  it("creates, joins, applies commands, and resyncs snapshots", async () => {
    const instructor = await connect();
    const monitor = await connect();
    const created = await createSession(instructor, {
      protocolVersion,
    });

    expect(created.ok).toBe(true);

    if (!created.ok) {
      return;
    }

    const joined = await joinSession(monitor, {
      protocolVersion,
      role: "monitor",
      joinCode: created.joinCode,
    });

    expect(joined.ok).toBe(true);

    const nextMonitorSnapshot = new Promise<SessionSnapshot>((resolve) => {
      monitor.once("session:snapshot", resolve);
    });
    const applied = await applyCommand(instructor, {
      protocolVersion,
      sessionId: created.sessionId,
      instructorToken: created.instructorToken,
      command: { type: "vitals.patch", payload: { heartRate: 101 } },
    });

    expect(applied.ok).toBe(true);

    const snapshot = await nextMonitorSnapshot;
    expect(snapshot.patient.heartRate).toBe(101);
    expect(snapshot.revision).toBe(1);

    const resynced = await resyncSession(monitor, {
      protocolVersion,
      role: "monitor",
      joinCode: created.joinCode,
    });

    expect(resynced.ok).toBe(true);

    if (resynced.ok) {
      expect(resynced.snapshot.patient.heartRate).toBe(101);
      expect(resynced.snapshot.revision).toBe(1);
    }
  });

  it("rejects instructor commands authorized only with a public join code", async () => {
    const instructor = await connect();
    const created = await createSession(instructor, {
      protocolVersion,
    });

    expect(created.ok).toBe(true);

    if (!created.ok) {
      return;
    }

    const applied = await applyCommand(instructor, {
      protocolVersion,
      sessionId: created.sessionId,
      instructorToken: created.joinCode,
      command: { type: "vitals.patch", payload: { heartRate: 110 } },
    });

    expect(applied).toEqual({
      ok: false,
      error: { code: "forbidden", message: "Instructor credential is invalid." },
    });
  });

  it("expires and removes inactive sessions", async () => {
    const session = createSimulationSession(new Date("2026-07-11T12:00:00.000Z"));
    await store.create(session);

    const expiredSessionIds = await expireSessions(
      ioServer,
      store,
      new Date(session.expiresAt.getTime() + sessionTtlMs),
    );

    expect(expiredSessionIds).toEqual([session.sessionId]);
    expect(await store.get(session.sessionId)).toBeNull();
  });
});
