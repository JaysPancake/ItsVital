# ItsVital

**ItsVital** is a free and open-source, browser-based patient-monitor simulation platform for EMS, nursing, respiratory, and medical education.

Its goal is simple: **turn ordinary devices into connected training monitors without requiring proprietary hardware or a native application.**

> [!WARNING]
> ItsVital is a training and simulation tool only. It is not a medical device and must not be used for real patient monitoring, diagnosis, treatment, or clinical decision-making.

## Project status

**Status: early development / pre-alpha**

The repository is currently being scaffolded. There is not yet a stable release or a complete working monitor. Features listed in the roadmap are plans, not promises of current functionality.

Feature status is described as:

- **Planned** — designed or proposed, but not implemented
- **In progress** — actively being built, but not complete
- **Complete** — core behavior works, relevant tests pass, and limitations are documented

## Why ItsVital?

Commercial simulation systems can be expensive, hardware-dependent, and difficult to deploy across classrooms or small training programs.

ItsVital is being designed to be:

- **Browser-first** — use a modern browser on a tablet, laptop, phone, desktop, or projector
- **Open source** — inspect, modify, self-host, and contribute to the software
- **Instructor-controlled** — change simulated patient conditions in real time
- **Device-agnostic** — no required proprietary monitor hardware
- **Accessible** — support keyboard use, touch devices, visible alarm states, and alternatives to color-only cues
- **Manufacturer-neutral** — clinically familiar without copying proprietary monitor interfaces or assets

The software itself is free and open source. Any future community-hosted service may have usage limits based on available funding and infrastructure.

## How it will work

1. An instructor creates a temporary simulation session.
2. The server provides a short monitor join code and a separate instructor credential.
3. Learners open the monitor route on another device and enter the join code.
4. The instructor changes simulated physiology and monitor settings.
5. Connected monitors receive the updated session state in real time.
6. A disconnected monitor can reconnect and recover the complete current state.
7. Inactive sessions expire automatically.

The server is authoritative for active session state. Clients send validated commands, and waveform samples are generated locally in the browser rather than streamed over the network.

## Initial milestone: v0.0.1

The first milestone is intentionally narrow. The priority is proving a reliable two-browser instructor-to-monitor workflow before adding broad clinical features.

### Planned for v0.0.1

- Temporary session creation
- Short monitor join codes
- Separate instructor credentials
- Instructor and monitor routes in one React application
- Real-time synchronization with Socket.IO
- Server-authoritative state and runtime validation
- Numeric controls for:
  - Heart rate
  - SpO2
  - Respiratory rate
  - Non-invasive blood pressure
  - EtCO2
- One locally generated sinus ECG waveform
- Disconnect, reconnect, and full-state resynchronization
- Automatic session expiration and cleanup
- Unit tests and a two-browser Playwright workflow

### Not blocking v0.0.1

The following are intentionally deferred:

- Accounts and organizations
- Persistent databases or Supabase integration
- Saved scenario libraries
- Multiple ECG rhythms
- Advanced alarm behavior
- Twelve-lead acquisition
- PDF or print export
- Offline/PWA support
- Native mobile applications
- Ventilator, manikin, CPR-feedback, or proprietary hardware integrations

## Planned roadmap

### v0.0.2 — Basic monitor behavior

- Pleth and capnography waveforms
- Canvas-based waveform renderer
- Sweep speed and display controls
- Basic alarm thresholds
- Alarm audio, mute state, and visible alarm messaging

### v0.0.3 — Clinical controls

- Additional rhythm selection
- NIBP measurement cycles
- Lead selection
- Artifact controls
- Numeric and waveform trends
- Session event log

### v0.1.0 — Scenario system

- Runtime-validated scenario schema
- Timeline actions
- Pause and resume
- Save and load scenarios
- Example fictional cases
- Scenario validation and error reporting

### Later possibilities

- User accounts and organizations
- Persistent storage adapters
- Docker-based self-hosting
- Community-hosted deployment
- Progressive Web App support
- Collaborative instructors
- Twelve-lead acquisition and review
- Debrief exports
- Carefully scoped hardware integrations

## Technical direction

### Frontend

- React
- TypeScript with strict mode
- Vite
- React Router
- Canvas 2D for initial waveform rendering
- Web Audio API for future alarms

### Backend

- Node.js 24 LTS
- Express
- Socket.IO
- Zod for runtime validation
- In-memory session storage behind a replaceable interface

### Tooling

- pnpm workspaces
- Vitest
- Playwright
- ESLint and formatting checks
- GitHub Actions CI

Major framework changes should be discussed before implementation. The current direction intentionally avoids Angular, Flutter, React Native, Next.js, and NestJS unless a future architectural decision demonstrates a clear need.

## Target repository structure

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

- **`apps/web`** — one browser application containing the instructor and monitor experiences
- **`apps/server`** — authoritative session state, authorization, validation, expiration, synchronization, and reconnection
- **`packages/protocol`** — shared Socket.IO contracts, Zod schemas, commands, snapshots, and protocol versions
- **`packages/waveforms`** — framework-independent waveform generation and timing logic
- **`e2e`** — browser-to-browser Playwright tests

A shared UI package will not be added until at least two real applications need the same components.

## Architecture principles

- The server is the source of truth for active simulations.
- A public join code never grants instructor permissions.
- Every inbound payload is validated at runtime.
- Every instructor command is authorized on the server.
- Session snapshots include protocol and revision information.
- Clients can request a complete snapshot after missed updates or reconnects.
- Waveform points are generated in the browser and are not streamed through Socket.IO.
- High-frequency waveform samples do not belong in React state.
- Patient physiology, monitor configuration, scenario execution, and connection metadata remain separate domains.
- Initial storage stays in memory behind an interface so later database adapters do not control the domain model.
- Tests, examples, screenshots, and fixtures use fictional data only.

See [`AGENTS.md`](./AGENTS.md) for detailed repository-wide implementation instructions for Codex and other coding agents.

## Getting started

The workspace has not yet been fully scaffolded, so installation and development commands may not work until the initial project setup is complete.

Once scaffolding is finished, the expected workflow will be:

```bash
git clone https://github.com/JaysPancake/ItsVital.git
cd ItsVital
pnpm install
pnpm dev
```

Expected root commands:

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
```

The README will be updated as soon as those commands are implemented and verified.

## Contributing

Contributions are welcome from developers, EMS clinicians, nurses, respiratory therapists, physicians, simulation educators, students, accessibility reviewers, and technical writers.

Helpful ways to contribute include:

- Open an issue describing a bug or focused feature request
- Review the planned architecture
- Help define realistic but manufacturer-neutral monitor behavior
- Improve accessibility
- Add tests
- Improve documentation
- Create fictional educational scenarios after the scenario format is available

Before submitting code:

1. Read [`AGENTS.md`](./AGENTS.md).
2. Keep changes focused and reviewable.
3. Add or update relevant tests.
4. Do not include secrets, real patient information, protected health information, or proprietary assets.
5. Report the commands used to validate the change.

A dedicated `CONTRIBUTING.md` will be added as the project workflow matures.

## Security

Do not open a public issue containing vulnerability details, credentials, tokens, personal information, or exploit steps.

Read [`SECURITY.md`](./SECURITY.md) for the supported-version policy, private reporting process, safe testing rules, and disclosure expectations.

## Clinical and legal boundaries

ItsVital should model educational monitor behavior without making diagnostic claims.

- Do not use ItsVital for real patient care.
- Do not enter real patient information or protected health information.
- Do not rely on simulated waveforms, values, alarms, or calculations for clinical decisions.
- Do not copy manufacturer logos, layouts, alarm sounds, icons, screenshots, or proprietary graphics.
- Do not imply regulatory clearance, medical-device status, or endorsement by a monitor manufacturer.

## License

ItsVital is licensed under the [MIT License](./LICENSE).

You may use, modify, and distribute the software under the terms of that license. Copyright and license notices must be preserved as required by the license.

Educational scenarios and other non-code content may receive a separate content license in the future.

## Vision

ItsVital aims to become an accessible, community-built platform for simulation-based education by making realistic instructor-controlled monitor experiences easier to create, deploy, study, and improve.

The long-term goal is not to reproduce one commercial product. It is to build an open foundation that educators and developers can adapt to their own training environments.

## Support the project

- Star the repository
- Open focused issues
- Share the project with simulation educators
- Contribute code, testing, clinical review, accessibility feedback, or documentation
