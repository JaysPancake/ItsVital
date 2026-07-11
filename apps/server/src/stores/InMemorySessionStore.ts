import type { SessionStore, SimulationSession } from "../sessions/session.js";

export class InMemorySessionStore implements SessionStore {
  readonly #sessions = new Map<string, SimulationSession>();

  async create(session: SimulationSession): Promise<void> {
    this.#sessions.set(session.sessionId, session);
  }

  async get(id: string): Promise<SimulationSession | null> {
    return this.#sessions.get(id) ?? null;
  }

  async getByJoinCode(joinCode: string): Promise<SimulationSession | null> {
    const normalizedJoinCode = joinCode.toUpperCase();

    for (const session of this.#sessions.values()) {
      if (session.joinCode === normalizedJoinCode) {
        return session;
      }
    }

    return null;
  }

  async update(session: SimulationSession): Promise<void> {
    this.#sessions.set(session.sessionId, session);
  }

  async delete(id: string): Promise<void> {
    this.#sessions.delete(id);
  }

  async list(): Promise<SimulationSession[]> {
    return Array.from(this.#sessions.values());
  }
}
