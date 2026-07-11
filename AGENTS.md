# AGENTS.md

## Purpose

This file provides repository-wide instructions for Codex and other coding agents working on **ItsVital**.

ItsVital is a free and open-source, browser-based patient-monitor simulation platform for EMS, nursing, respiratory, and medical education. It is a **training tool only** and must never be presented as suitable for real patient care or clinical decision-making.

These instructions apply to the entire repository unless a more specific `AGENTS.md` exists in a subdirectory.

## Product principles

All implementation decisions should support these priorities, in order:

1. Reliable instructor-to-monitor synchronization.
2. Fast browser-based setup with no required native application.
3. Realistic but generic medical-monitor behavior.
4. Accessibility for learners and instructors.
5. Simple self-hosting and open-source contribution.
6. Maintainable architecture over premature feature breadth.

Do not copy proprietary monitor layouts, logos, alarm sounds, icons, graphics, or other protected assets. The interface may be clinically familiar, but it should remain an original, manufacturer-neutral design.

## Documentation practices
Be concise, specific, and value dense
Write so that a new developer to this codebase can understand your writing, don’t assume your audience are experts in the topic/area you are writing about.

## Current technical direction

Use the following stack unless an issue or maintainer instruction explicitly changes it:

- Node.js 24 LTS
- pnpm workspaces
- React
- TypeScript with strict mode enabled
- Vite
- React Router
- Node.js server
- Express
- Socket.IO
- Zod for runtime validation
- Canvas 2D for initial waveform rendering
- Vitest for unit and integration tests
- Playwright for browser-to-browser end-to-end tests

Do not introduce Angular, Flutter, React Native, Next.js, NestJS, a second package manager, or another major framework without an explicit architectural decision.

### Use Canvas 2D as the default waveform renderer.

Keep waveform generation independent from the rendering API. Rendering
implementations must conform to a shared renderer interface so that a WebGL
or other GPU-backed renderer can be introduced later without rewriting the
physiology or waveform-generation logic.

Do not introduce WebGL based only on anticipated performance needs. Profile
the Canvas 2D implementation on representative phones, tablets, laptops, and
projectors first. Consider WebGL only when measured performance remains
insufficient after reasonable Canvas optimizations.

## Target repository structure

The initial structure should remain small:

```text
apps/
  web/
    src/
      app/
      features/
        instructor/
        monitor/
        sessions/
        alarms/
      components/
      infrastructure/
  server/
    src/
      sessions/
      realtime/
      validation/
      stores/
packages/
  protocol/
  waveforms/
e2e/
```

### Package responsibilities

#### `apps/web`

Contains the browser interface for both instructor and monitor experiences.

Use one web application with routes such as:

- `/`
- `/instructor`
- `/instructor/:sessionId`
- `/monitor`
- `/monitor/:sessionCode`

Do not create separate instructor and monitor applications unless deployment requirements later prove that separation is necessary.

#### `apps/server`

Owns the authoritative simulation-session state, permissions, validation, expiration, synchronization, and reconnection behavior.

The server must never trust the client to enforce permissions or validate commands.

#### `packages/protocol`

Contains shared, runtime-validated contracts used by both the web client and server, including:

- Socket.IO event definitions
- Zod schemas
- Session snapshots
- Instructor commands
- Join and creation results
- Shared enums and value objects
- Protocol version information

Infer TypeScript types from Zod schemas where practical. Avoid maintaining separate handwritten runtime schemas and TypeScript interfaces for the same contract.

#### `packages/waveforms`

Contains framework-independent waveform and timing logic.

Waveform generation should use pure functions wherever possible. It must not depend on React, browser DOM state, Socket.IO, or server code.

Do not create a shared UI package until at least two real applications need the same reusable components.

## Initial milestone

The first vertical slice is more important than broad feature coverage.

Implement this workflow before adding advanced rhythms or scenario editing:

1. Instructor creates a temporary session.
2. Server returns a short monitor join code and a separate instructor credential.
3. A monitor joins from a second browser context.
4. Instructor updates numeric vital signs.
5. Monitor receives the update immediately.
6. Monitor disconnects temporarily.
7. Instructor changes state while the monitor is disconnected.
8. Monitor reconnects and receives the complete current snapshot.
9. Session expires and is cleaned up automatically.

The first supported values should be:

- Heart rate
- SpO2
- Respiratory rate
- Non-invasive blood pressure
- EtCO2
- One sinus ECG waveform

Do not block this milestone on:

- Accounts or organizations
- Supabase
- Persistent scenarios
- Native applications
- PWA support
- Twelve-lead acquisition
- Advanced alarm behavior
- Multiple ECG rhythms
- PDF or print export

## Architecture rules

### Server-authoritative state

The server is the source of truth for every active simulation session.

Clients send commands describing intent. They must not replace arbitrary portions of session state.

Prefer discriminated unions such as:

```ts
type InstructorCommand =
  | {
      type: "vitals.patch";
      payload: {
        heartRate?: number;
        spo2?: number;
        respiratoryRate?: number;
        etco2?: number;
      };
    }
  | {
      type: "bloodPressure.set";
      payload: {
        systolic: number;
        diastolic: number;
      };
    }
  | {
      type: "rhythm.set";
      payload: {
        rhythm: "sinus";
      };
    };
```

Every accepted command should:

1. Be validated at runtime.
2. Be authorized for the current client.
3. Be applied by the server.
4. Increment a monotonic session revision.
5. Produce an updated snapshot or patch.
6. Return a structured success or error result.

### Protocol versioning

Every session snapshot should include at least:

- `protocolVersion`
- `sessionId`
- `revision`
- `serverTime`

Do not silently accept incompatible protocol versions.

### Reconnection

Assume browsers will sleep, reload, change networks, and miss updates.

Socket.IO connection recovery may be used, but the application must also support complete state resynchronization. When recovery is unavailable or uncertain, request or send a full session snapshot.

Never assume that receiving every incremental patch is guaranteed.

### Socket.IO rooms

Use one server-side room per simulation session.

Keep event names explicit and namespaced, for example:

- `session:create`
- `session:join`
- `session:resync`
- `session:snapshot`
- `session:expired`
- `command:apply`

Avoid generic events such as `update`, `change`, or `message`.

Use acknowledgements for commands that require a success or error result.

### Waveform transport

Never stream rendered waveform sample points through Socket.IO.

The server should transmit physiological parameters and effective timestamps. The browser should generate and render waveform samples locally.

React should manage application state and controls. Canvas rendering should run outside React's per-frame render cycle using `requestAnimationFrame` or another dedicated timing loop.

### State boundaries

Keep these domains separate:

- Patient physiology
- Monitor configuration
- Scenario execution
- Connection/session metadata

For example, a patient may have a blood pressure even when the simulated monitor has not completed an NIBP measurement cycle. Do not collapse all concepts into a single generic `vitals` object.

### Storage

Begin with an in-memory session store behind an interface.

```ts
interface SessionStore {
  create(session: SimulationSession): Promise<void>;
  get(id: string): Promise<SimulationSession | null>;
  update(session: SimulationSession): Promise<void>;
  delete(id: string): Promise<void>;
}
```

Do not couple the session domain directly to Supabase, Postgres, Redis, or another provider. A later persistence adapter should implement the same domain-facing interface.

## Security rules

- A public join code must never grant instructor permissions.
- Instructor credentials must be long, unguessable secrets.
- Validate every inbound payload with Zod or an equivalent approved schema.
- Authorize every instructor command on the server.
- Add sensible limits for session creation, join attempts, message frequency, payload size, and clients per session.
- Expire inactive sessions automatically.
- Never commit credentials, secrets, `.env` files, access tokens, or real patient data.
- Use only fictional patient and scenario data in tests, examples, screenshots, and fixtures.
- Avoid logging secret tokens or sensitive session details.

## TypeScript and code quality

- Enable strict TypeScript settings.
- Avoid `any`. Use `unknown` at external boundaries and narrow it through validation.
- Prefer small modules with one clear responsibility.
- Prefer named exports for shared modules.
- Use descriptive domain names rather than abbreviations when ambiguity is possible.
- Keep side effects at application boundaries.
- Keep protocol and waveform packages framework-independent.
- Do not add dependencies for behavior that can be implemented clearly with the existing stack.
- Remove dead code rather than commenting it out.
- Add comments for clinical or timing rationale, not for syntax that is already obvious.

Use clinically recognizable names such as `heartRate`, `respiratoryRate`, `systolic`, and `diastolic`. Include units in display components and in names where the unit is otherwise ambiguous.

## React rules

- Use function components and hooks.
- Keep active Socket.IO connection setup in a dedicated infrastructure layer.
- Do not open a new socket connection from every component.
- Separate server session state from local display state.
- Avoid putting high-frequency waveform samples in React state.
- Keep monitor rendering responsive across phones, tablets, laptops, and projectors.
- Prefer semantic HTML for controls, dialogs, forms, and navigation.
- Do not use color alone to communicate alarm severity or connection state.

Do not add a global state library until React context and feature-local state become demonstrably inadequate. If one is later required, prefer a small focused solution and document the reason.

## Testing expectations

Every behavioral change should include the smallest useful test at the appropriate level.

### Unit tests

Prioritize tests for:

- Zod schemas and boundary values
- Session state transitions
- Authorization rules
- Revision increments
- Session expiration
- Waveform timing and output
- Prevention of `NaN` and infinite waveform values
- Reconnection and snapshot selection logic

### End-to-end tests

Maintain a Playwright test for the core two-browser workflow:

1. Create an instructor session.
2. Open a separate monitor context.
3. Join with the code.
4. Change heart rate.
5. Confirm the monitor updates.
6. Disconnect the monitor.
7. Change heart rate again.
8. Reconnect.
9. Confirm the monitor receives the current state.

Do not use arbitrary sleeps in tests when an observable state or event can be awaited.

## Accessibility

Accessibility is a product requirement, not a later polish task.

- Support keyboard navigation for instructor controls.
- Use appropriately sized touch targets.
- Provide text or symbols in addition to color.
- Expose alarm state visibly as well as audibly.
- Make muted audio unmistakable.
- Avoid unsafe flashing and unnecessary animation.
- Respect reduced-motion preferences where practical.
- Maintain usable contrast.
- Ensure dialogs and forms have accessible names and focus behavior.

A realistic learner-facing monitor may intentionally be visually dense, but instructor controls and optional accessibility aids should remain usable.

## Clinical realism

ItsVital should model monitor behavior rather than make diagnostic claims.

- Clearly distinguish displayed values from underlying patient state where relevant.
- Use documented, testable formulas for waveform timing and derived values.
- Record the rationale for clinically significant ranges or behavior.
- Avoid implying that one waveform or value is a complete representation of real physiology.
- Keep educational disclaimers visible in documentation and appropriate application surfaces.

When uncertain about clinical behavior, implement the simplest neutral behavior and document the uncertainty rather than inventing realism.

## Package and command conventions

Use pnpm only. Commit `pnpm-lock.yaml`.

Once the workspace is scaffolded, the root should provide these commands:

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
```

Before marking work complete, run the relevant commands. For broad changes, run all available checks.

If a command cannot run because the repository has not yet been scaffolded or because of an environment limitation, state that clearly in the final report.

## Agent workflow

Before editing:

1. Read this file and any more specific nested `AGENTS.md` files.
2. Inspect the relevant existing code and tests.
3. Confirm the change belongs in the intended package.
4. Avoid broad refactors unrelated to the task.

While editing:

1. Keep changes focused and reviewable.
2. Preserve public contracts unless the task explicitly changes them.
3. Add or update tests with the implementation.
4. Update documentation when commands, architecture, environment variables, or user-facing behavior change.
5. Do not hide errors with broad catches, disabled lint rules, or unsafe type assertions.

Before finishing:

1. Run formatting, linting, type checking, tests, and builds relevant to the change.
2. Review the diff for accidental generated files, secrets, or unrelated edits.
3. Summarize what changed.
4. List validation commands and their outcomes.
5. State any remaining risks or follow-up work.

## Documentation rules

Keep the README aligned with the implemented state.

Use the existing feature status language consistently:

- Planned
- In progress
- Complete

Do not mark a feature complete merely because a UI placeholder exists. A feature is complete only when its core behavior works, relevant tests pass, and its limitations are documented.

Add architectural decisions to a future `docs/decisions/` directory when a choice meaningfully affects contributors, deployment, data ownership, protocol compatibility, or long-term maintenance.

## Definition of done

A task is complete when:

- The requested behavior is implemented.
- Types and runtime validation agree.
- Relevant tests pass.
- No new secrets or real patient information are present.
- User-facing behavior is accessible at a reasonable baseline.
- Documentation is updated where necessary.
- The final response accurately reports validation and limitations.
