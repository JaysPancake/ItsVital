import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@itsvital/protocol";

type ItsVitalSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const serverUrl =
  (import.meta as ImportMeta & { env?: { VITE_SERVER_URL?: string } }).env?.VITE_SERVER_URL ??
  "http://localhost:3001";

let socket: ItsVitalSocket | null = null;

export function getSocket(): ItsVitalSocket {
  socket ??= io(serverUrl, { autoConnect: true });

  return socket;
}
