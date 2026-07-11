# ItsVital

**ItsVital** is a free and open-source, browser-based medical simulation platform for EMS, nursing, respiratory, and medical education.

Its mission is to provide a capable, accessible alternative to expensive commercial simulation systems so that smaller, rural, volunteer, lower-income, and otherwise under-resourced agencies can provide high-quality medical simulation training.

ItsVital is intended to become a complete, practical simulator that educators can use without purchasing proprietary monitor hardware or costly software licenses.

> [!WARNING]
> ItsVital is a training and simulation tool only. It is not a medical device and must not be used for real patient monitoring, diagnosis, treatment, or clinical decision-making.

> [!NOTE]
> ItsVital is an independent project and is not affiliated with, endorsed by, or sponsored by any medical-device manufacturer.

## Project status

**Status: early development / pre-alpha**

The repository is currently being scaffolded. There is not yet a stable release or a complete working monitor. Features listed in the roadmap are plans, not promises of current functionality.

Feature status is described as:

- **Planned** — designed or proposed, but not implemented
- **In progress** — actively being built, but not complete
- **Complete** — core behavior works, relevant tests pass, and limitations are documented

## Why ItsVital?

High-quality medical simulation improves education, clinical decision-making, teamwork, communication, and readiness for uncommon or high-risk events. However, many commercial simulation systems are priced beyond the reach of smaller agencies, volunteer services, rural departments, community programs, and individual educators.

ItsVital exists to reduce that access gap.

The project is being designed to offer a realistic instructor-controlled patient-monitor experience using devices organizations may already own. It should be usable as a complete training product while remaining open for educators and developers to inspect, adapt, improve, and self-host.

ItsVital is being designed to be:

- **Free and open source** — use, inspect, modify, self-host, and contribute to the software
- **Browser-first** — run on a modern browser using a tablet, laptop, phone, desktop, or projector
- **Instructor-controlled** — change simulated patient conditions and monitor behavior in real time
- **Device-agnostic** — avoid required proprietary monitor hardware
- **Practical for small agencies** — minimize setup, infrastructure, licensing, and deployment barriers
- **Accessible** — support keyboard use, touch devices, visible alarm states, and alternatives to color-only cues
- **Manufacturer-neutral** — provide clinically familiar behavior without copying proprietary interfaces or assets
- **Community-built** — combine development, clinical review, education experience, testing, and accessibility feedback

The software itself is free and open source. Any future community-hosted service may have usage limits based on available funding and infrastructure, while self-hosting should remain a supported long-term option.

## Intended users

ItsVital is intended for organizations and educators including:

- EMS and fire agencies
- Volunteer and rural services
- Community colleges and training academies
- Nursing, respiratory, and medical programs
- Hospital education departments
- Simulation centers
- Independent instructors
- Students practicing in supervised educational environments

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

### Long-term product direction

ItsVital is intended to grow beyond a basic monitor display into a broader medical simulation platform. Potential capabilities include:

- User accounts and organizations
- Shared scenario libraries
- Persistent storage adapters
- Docker-based self-hosting
- Community-hosted deployment
- Progressive Web App support
- Collaborative instructors
- Twelve-lead acquisition and review
- Debrief timelines and exports
- Additional monitor modes and clinical devices
- Carefully scoped ventilator, CPR-feedback, manikin, or hardware integrations
- Extensible interfaces for community-developed simulation modules

These additions should support the primary goal of delivering a useful, affordable simulator—not turn the project into a framework that requires organizations to build their own product before they can train with it.

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

- The finished product should be usable by educators without requiring custom software development.
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

### Prerequisites

- Node.js 24 LTS
- pnpm 11
- Git

The repository enforces Node 24 through `package.json` and `.npmrc`. Check your active tools before installing dependencies:

```bash
node --version
pnpm --version
```

If pnpm is not installed, install it with the method recommended for your operating system in the [pnpm installation guide](https://pnpm.io/installation). Do not use npm or Yarn to install this workspace.

### Install and run

```bash
git clone https://github.com/JaysPancake/ItsVital.git
cd ItsVital
pnpm install
pnpm dev
```

`pnpm dev` starts both development processes:

- Web application: `http://localhost:5173`
- Server health endpoint: `http://localhost:3001/health`

The current interface is an initial scaffold. Instructor-to-monitor synchronization remains planned for v0.0.1.

### Available commands

```bash
pnpm dev          # Start the web and server development processes
pnpm build        # Build all packages and applications
pnpm typecheck    # Type-check every workspace package
pnpm lint         # Run ESLint across the repository
pnpm test         # Run unit tests once with Vitest
pnpm test:watch   # Run unit tests in watch mode
pnpm test:e2e     # Build and run Playwright browser tests
```

### Testing

Run the fast local checks while developing:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Run a single Vitest file or filter tests by name:

```bash
pnpm test packages/protocol/src/index.test.ts
pnpm test --testNamePattern protocolVersion
```

Playwright requires its Chromium browser binary once per machine:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

Use Playwright's interactive UI or headed browser when investigating an end-to-end failure:

```bash
pnpm build
pnpm exec playwright test --ui
pnpm exec playwright test --headed --debug
```

HTML test reports are written to `playwright-report/`. Traces and failure artifacts are written to `test-results/`; both directories are ignored by Git.

### Debugging

To focus on one process, run it by workspace name:

```bash
pnpm --filter @itsvital/web dev
pnpm --filter @itsvital/server dev
```

The web application supports the React and browser developer tools available in your browser. Vite reports compile errors in both the terminal and its browser error overlay.

For a debugger attached to the server, start its TypeScript entry point with Node's inspector:

```bash
pnpm --filter @itsvital/server exec node --inspect --import tsx src/index.ts
```

Then attach your editor or open `chrome://inspect` in a Chromium browser. Set `PORT` or `WEB_ORIGIN` when the defaults conflict with another local service. In PowerShell, for example:

```powershell
$env:PORT=3101
$env:WEB_ORIGIN="http://localhost:5174"
pnpm --filter @itsvital/server dev
```

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
- Do not imply regulatory clearance, medical-device status, affiliation, endorsement, or sponsorship by a monitor or simulation-system manufacturer.

References to commercial products are descriptive comparisons only. Their names and trademarks belong to their respective owners.

## License

ItsVital is licensed under the [MIT License](./LICENSE).

You may use, modify, and distribute the software under the terms of that license. Copyright and license notices must be preserved as required by the license.

Educational scenarios and other non-code content may receive a separate content license in the future.

## Vision

ItsVital's vision is to make high-quality medical simulation available to educators and agencies that are currently priced out of commercial systems.

The project aims to become a free and open-source alternative to expensive products such as iSimulate and other proprietary medical simulation platforms. It should provide a polished, realistic, instructor-controlled training experience that can be deployed using ordinary devices and adapted to different educational environments.

ItsVital is not intended to be only a software foundation or developer toolkit. The primary product should work for instructors and learners out of the box. Open architecture, self-hosting, and community extensibility exist to make that simulator more accessible, sustainable, and adaptable.

Success means that a small agency, rural department, volunteer service, community program, or independent educator can conduct high-quality simulation without needing the budget of a large institution.

## Support the project

- Star the repository
- Open focused issues
- Share the project with simulation educators and smaller agencies
- Contribute code, testing, clinical review, accessibility feedback, or documentation
