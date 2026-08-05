# ItsVital Plans

This document tracks planned versions and major product directions for ItsVital.
It is intentionally forward-looking: items listed here are not complete unless
the README or release notes for a version explicitly mark them as complete.

ItsVital is a training and simulation tool only. It must never be used for real
patient care, diagnosis, treatment, monitoring, or clinical decision-making.

## Planning Principles

- Protect the instructor-to-monitor synchronization loop before expanding scope.
- Use basic accounts only where they protect limited public resources; defer organizations, marketplaces, and advanced identity features.
- Keep monitor behavior clinically recognizable but manufacturer-neutral.
- Keep scenario and branching tools simple enough for instructors to use live.
- Prefer runtime-validated protocol changes before UI-only features.
- Keep waveform generation browser-local; do not stream waveform samples over Socket.IO.
- Document clinical simplifications instead of inventing false precision.

## How To Read This Roadmap

- Versions are ordered capability gates, not calendar promises.
- A milestone advances only after its release criteria are met; unfinished work moves forward explicitly rather than being marked complete.
- Beginning with v0.2.0, every later release must preserve the accessibility baseline and pass the applicable accessibility regression checks.
- The official public service will require a basic instructor account to create sessions; monitors remain anonymous and self-hosted deployments may disable authentication.
- Personal scenarios remain browser-local and portable as JSON. A deployment may provide curated scenario collections without storing personal user data.

## Current Baseline: v0.0.3

Status: Complete pre-alpha basic alarms and instructor ergonomics milestone.

The current project already supports:

- Temporary instructor-created sessions.
- Short monitor join codes.
- Separate instructor credentials.
- Instructor and monitor routes in one React app.
- Real-time Socket.IO synchronization.
- Server-authoritative state and runtime validation.
- Numeric controls for heart rate, SpO2, respiratory rate, NIBP, and EtCO2.
- Locally generated sinus ECG, pleth, and capnography waveforms.
- Reusable Canvas 2D rendering with local sweep, grid, and gain controls.
- Instructor-managed and student-operated monitor modes.
- Runtime-validated, server-authoritative alarm limits for continuous vital signs.
- Visible high/low alarm states and locally enabled, manufacturer-neutral alarm audio.
- Instructor-synchronized alarm audio mute state.
- Accessible instructor step controls and clearer connection/session messaging.
- Monitor reconnect with full current snapshot recovery.
- Automatic session expiration and cleanup.
- Unit tests and a two-browser Playwright workflow.

Known limitations:

- The monitor is still a narrow training slice, not a complete monitor simulation.
- Only sinus ECG is supported.
- Alarm behavior is intentionally basic: one priority, non-latching state, no delay, and no history.
- Alarm audio must be enabled separately in each monitor browser before it can sound.
- NIBP alarms are deferred until the timed measurement model is implemented.
- NIBP capture is immediate and does not yet model a timed measurement cycle.
- Scenario playback and branching instructor workflows are not yet implemented.

## v0.0.2: Monitor Feel And Waveform Stability

Goal: make the existing monitor view feel stable, credible, and alive.

Status: Complete.

Completed changes:

- Fix current ECG/QRS rendering issues.
- Refactor waveform drawing toward a reusable Canvas 2D renderer shape.
- Add pleth waveform generation and display.
- Add capnography waveform generation and display.
- Add sweep speed and display configuration.
- Improve waveform labels, grid behavior, scaling, and responsive sizing.
- Keep waveform generation framework-independent in `packages/waveforms`.
- Add waveform tests for finite output, timing, and safe boundary handling.
- Add instructor-managed and student-operated modes, including learner channel activation and immediate NIBP value capture.

Release criteria:

- Typecheck, lint, unit tests, and e2e tests pass.
- ECG, pleth, and capnography render without obvious blanking or layout issues.
- Waveforms remain local to the browser and are not streamed from the server.

## v0.0.3: Basic Alarms And Instructor Ergonomics

Goal: make the app useful for short live training moments.

Status: Complete.

Completed changes:

- Added runtime-validated alarm limits for heart rate, SpO2, respiratory rate, and EtCO2.
- Added visible, non-latching high/low alarms that evaluate only active monitor channels.
- Added an original two-beep Web Audio pattern that each monitor enables locally.
- Added instructor-controlled, server-synchronized alarm audio mute state.
- Added instructor alarm limit controls and accessible vital-sign step buttons.
- Added local blood-pressure relationship validation while preserving server validation.
- Added connecting, connected, reconnecting/stale, expired, and error messaging.
- Kept NIBP alarms deferred to v0.0.5, alongside timed NIBP measurement behavior.

Release criteria:

- Alarm state is visible and not communicated by color alone.
- Alarm threshold and mute behavior have unit coverage.
- E2E coverage confirms a monitor-visible alarm after an instructor change.

## v0.0.4: Basic Accounts And Public Usage Tracking

Goal: protect limited public hosting resources and measure instructor session usage without adding organizations or storing simulation content in Firebase.

Planned changes:

- Add Firebase Authentication with email/password signup, Google sign-in, email verification, password reset, login, and sign-out.
- Require a verified instructor account only when creating a session on the official public service.
- Keep monitor joins anonymous and keep authentication disabled by default for local and self-hosted deployments.
- Verify Firebase ID tokens on the authoritative Node.js server before public session creation.
- Continue using the separate instructor session credential for session reconnection and commands; signing out does not invalidate an active instructor session.
- Provision a dedicated `itsvital-app-prod` Firebase project with Standard-edition Firestore in `us-central1` when implementation begins.
- Record a server-authored `usageSessions` ledger containing only owner UID, creation and expiration timestamps, final revision, end reason, and a 90-day retention timestamp.
- Deny all direct client access to the usage ledger and enable Firestore TTL deletion after 90 days.
- Do not store email addresses, patient state, vital signs, scenarios, join codes, instructor credentials, or real patient information in usage records.
- Add a public-service privacy notice describing collection purpose, retention, and Firebase processing.

Release criteria:

- Auth-emulator coverage confirms signup, verification, login, password reset, Google sign-in, and sign-out behavior.
- Server tests reject missing, invalid, expired, and unverified identity tokens when public authentication is required.
- A verified instructor can create a session, while monitors can still join without an account.
- The existing two-browser workflow continues to pass with authentication disabled.
- Usage-ledger tests confirm the allowed field set, best-effort finalization, 90-day retention timestamp, and absence of simulation content or email addresses.
- Firestore emulator tests confirm direct unauthenticated and authenticated client reads and writes are denied.
- Account quotas, suspension controls, organizations, profiles, and a custom usage dashboard remain deferred until real usage data justifies them.

## v0.0.5: NIBP, Trends, And Event Log

Goal: model more monitor behavior instead of only displaying raw patient state.

Planned changes:

- Separate underlying patient blood pressure from displayed NIBP measurement.
- Add manual NIBP measurement cycle states.
- Add timestamped NIBP result display.
- Add numeric trend history for supported vital signs.
- Add session event log for joins, disconnects, instructor changes, alarms, and NIBP events.
- Show useful instructor-side session history for debugging and debriefing.

Release criteria:

- NIBP state transitions have unit coverage.
- Event log ordering and revision behavior are tested.
- E2E coverage confirms an NIBP measurement updates the monitor display.

## v0.0.6: Rhythm And Artifact Expansion

Goal: support a small set of practical training rhythms and monitor artifacts.

Planned changes:

- Expand rhythm protocol beyond sinus only.
- Add a small initial rhythm set, such as:
  - Sinus rhythm.
  - Sinus bradycardia.
  - Sinus tachycardia.
  - Asystole.
  - Ventricular tachycardia, if the waveform model is simple and testable enough.
- Add instructor rhythm selection.
- Add simple artifact controls:
  - None.
  - Mild motion.
  - Severe motion.
  - Lead disconnected or flat trace.
- Add lead label/display state.
- Document clinical simplifications for each rhythm and artifact.

Release criteria:

- Waveform output for each rhythm remains finite and bounded.
- Rhythm changes synchronize through the server-authoritative protocol.
- E2E coverage confirms a rhythm change appears on the monitor.

## v0.0.7: Portable Scenarios And Examples

Goal: let instructors create, validate, save, and exchange reusable scenarios before introducing automated playback.

Planned changes:

- Add a versioned, runtime-validated scenario schema in `packages/protocol`.
- Support JSON import and export with clear, field-specific validation errors.
- Store an instructor's personal scenario collection in the browser.
- Bundle a small set of fictional starter scenarios that demonstrate the format without using real patient information.
- Include scenario metadata, initial physiology and monitor state, and future-compatible action definitions.
- Document format compatibility and reject unsupported scenario versions explicitly.
- Keep scenario documents portable and independent from accounts, organizations, or a particular hosting provider.

Release criteria:

- Valid, invalid, incompatible-version, import, export, and round-trip fixtures are tested.
- An instructor can load a bundled scenario, duplicate it, edit supported values, export it, and import it in a new browser profile.
- Scenario files cannot bypass the same clinical ranges and runtime validation used by live instructor commands.
- Timed playback, pause, branching, and debrief behavior are explicitly deferred to later milestones.

## v0.1.0: Scenario Playback

Goal: run a portable scenario as a reliable, server-authoritative timeline while preserving live instructor control.

Planned changes:

- Add timeline actions for physiology, rhythm, alarms, NIBP behavior, monitor settings, and waits.
- Add server-authoritative playback state with start, pause, resume, and stop commands.
- Record effective timestamps so playback remains deterministic across connected browsers.
- Allow live instructor overrides without letting clients replace arbitrary session state.
- Define and display how an override affects upcoming scenario actions.
- Include playback state and the current scenario position in complete snapshots for reconnect recovery.
- Record scenario start, pause, resume, stop, action, and override events in the session event log.

Release criteria:

- Playback timing, pause, resume, stop, override, revision, and reconnect behavior have automated coverage.
- A monitor that disconnects during playback receives the complete current state and scenario position after reconnecting.
- E2E coverage runs a minimal imported scenario and confirms synchronized monitor updates without arbitrary sleeps.

## v0.2.0: Accessibility And Onboarding

Goal: make core setup and instructor workflows usable by more educators and establish accessibility as an ongoing release requirement.

Planned changes:

- Target WCAG 2.2 AA for setup, navigation, instructor controls, scenario management, and debrief workflows.
- Complete keyboard-only and screen-reader reviews of the instructor and join flows.
- Verify focus order, accessible names, error identification, touch-target sizing, contrast, zoom, and responsive reflow.
- Ensure connection, alarm, audio, and validation states are never communicated by color or sound alone.
- Respect reduced-motion preferences and document justified exceptions in the visually dense learner monitor.
- Add plain-language first-run guidance for creating a session, joining a monitor, enabling audio, and loading a scenario.
- Add automated accessibility checks for stable workflows and a repeatable manual test checklist for behavior automation cannot assess.

Release criteria:

- No known WCAG 2.2 A or AA failures remain in the targeted workflows, with any monitor-specific exceptions documented and mitigated.
- Core instructor and monitor-join workflows are completable with a keyboard and a representative screen reader.
- Automated accessibility checks run in CI and the manual checklist is completed before release.

## v0.3.0: Approachable Hosting And Local Operation

Goal: let an educator try ItsVital immediately and give organizations tested, understandable ways to run the same application themselves.

Planned changes:

- Provide an official hosted instance where verified instructor accounts create temporary sessions, with published availability, usage-limit, data-lifetime, privacy, and support expectations.
- Publish a versioned container image and a single-container or Compose configuration for the web app and authoritative Socket.IO server.
- Add guided local launch scripts that check prerequisites, start required services, display usable local and LAN addresses, and report actionable failures.
- Document ports, origins, session expiration, reverse proxies, TLS, upgrades, rollback, backups where applicable, and safe exposure to a local network.
- Add separate liveness and readiness behavior suitable for local and hosted deployment checks.
- Provide provider-neutral deployment guidance so operators are not required to fork the project or adopt a specific cloud vendor.
- Add a configured GitHub Codespaces path for temporary evaluation and contribution, not permanent hosting.
- Limit GitHub Pages to project documentation or a non-functional frontend demonstration because it cannot run the Node.js and Socket.IO backend.

Release criteria:

- A first-time instructor can create or use an account and start a temporary session on the official hosted instance without installing development tools.
- Fresh-machine tests cover the documented local and container paths, including connecting a second device on the same network.
- Clean installation, upgrade, rollback, health-check, and common troubleshooting instructions are verified before publication.
- Hosting and local-operation flows pass the v0.2.0 accessibility regression checks.

## v0.4.0: Branching And Debrief

Goal: let instructors react quickly to learner decisions and review the resulting simulation timeline afterward.

Planned changes:

- Add prepared scenario decision points with a small set of clearly labeled next-state branches.
- Make branches available at their attached decision point and as instructor quick actions when explicitly configured.
- Apply an ordinary branch immediately through validated, authorized server commands.
- Require confirmation only when a branch would stop or replace the active scenario or end the current session.
- Record the selected branch, instructor notes, resulting state changes, and timing in the event log.
- Add an instructor debrief timeline combining scenario actions, manual overrides, alarms, NIBP events, connections, and branch selections.
- Keep learner-facing branch feedback debrief-first; any in-scenario prompt requires an explicit instructor action.

Release criteria:

- Branch authorization, validation, revision ordering, immediate application, and destructive-transition confirmation are tested.
- E2E coverage confirms a branch selection updates the monitor and appears in debrief.
- Branch and debrief workflows pass the accessibility regression checks.

## v0.5.0: Mature Monitor Behavior

Goal: deepen the generic monitor simulation without copying a proprietary device or making diagnostic claims.

Planned changes:

- Expand the practical, documented rhythm set while keeping every generator finite, bounded, and framework-independent.
- Add clinically neutral, testable alarm priorities, delays, acknowledgement behavior, and history.
- Add automatic NIBP intervals and clearer separation between underlying blood pressure and displayed measurements.
- Improve numeric and waveform trends, artifact behavior, lead state, display configuration, and projector readability.
- Document the educational simplifications and source rationale for clinically significant behavior.

Release criteria:

- Monitor state transitions, alarms, NIBP automation, rhythms, trends, and artifacts have unit and browser coverage.
- Representative monitor layouts remain usable on phones, tablets, laptops, and projectors.
- Monitor configuration and controls pass the accessibility regression checks, and dense-display exceptions remain documented.

## v0.6.0: Reusable Scenario Library

Goal: make a growing scenario collection manageable without requiring user accounts or hosted personal data.

Planned changes:

- Add browser-local scenario organization, search, duplication, tagging, and recent-use behavior.
- Add whole-library backup and restore using documented, versioned portable files.
- Define compatibility and migration behavior for supported scenario format versions.
- Allow deployments to provide curated, read-only scenario collections separately from each user's browser-local library.
- Keep active sessions in memory by default and preserve storage interfaces so optional adapters do not control the domain model.
- Document data ownership, retention, migration, and recovery expectations for every supported storage mode.

Release criteria:

- Library search, duplicate handling, backup, restore, format migration, and incompatible-version behavior are tested.
- Clearing hosted server data does not delete an instructor's exported or browser-local scenario library.
- Library workflows pass the accessibility regression checks.

## v0.7.0: Classroom And Session Collaboration

Goal: support multiple educators in a live session without introducing organizations or weakening authorization boundaries.

Planned changes:

- Add separate, scoped co-instructor and read-only observer credentials that are never derived from the public monitor join code.
- Add explicit instructor handoff and credential revocation behavior.
- Show connected monitors, instructors, and observers without exposing secret credentials or unnecessary client details.
- Define which commands a co-instructor may apply and which session-owner actions require confirmation.
- Preserve full-snapshot resynchronization and event-log attribution across collaborator reconnects.

Release criteria:

- Permission, revocation, handoff, concurrent-command ordering, reconnect, and secret-redaction behavior are tested.
- E2E coverage exercises an owner, a co-instructor, an observer, and a monitor in separate browser contexts.
- Participant and collaboration workflows pass the accessibility regression checks.

## v0.8.0: Reliability, Security, And Performance

Goal: harden the complete education workflow for sustained public beta use and supported self-hosting.

Planned changes:

- Complete creation, join, command-rate, payload-size, and per-session client limits with observable, structured failures.
- Add abuse-resistance and load tests for authenticated public session creation, anonymous monitor joins, and Socket.IO traffic.
- Define protocol compatibility, minimum supported versions, upgrade behavior, and explicit rejection of incompatible clients.
- Test reconnect and resynchronization during network changes, browser sleep, server restart, and high event volume.
- Profile waveform rendering and session behavior on representative phones, tablets, laptops, and projectors before considering another renderer.
- Review runtime dependencies, logging, secret handling, deployment recovery, and security-reporting guidance.

Release criteria:

- Published capacity targets pass repeatable load, reconnect, and soak tests in a production-like environment.
- Supported deployments can detect incompatible versions and recover from documented failure scenarios.
- The full application passes the accessibility regression suite on the supported browser and device matrix.

## v0.9.0: Public Beta And Release Candidate

Goal: freeze the v1 scope, validate it with educators, and remove release-blocking usability, accessibility, deployment, and reliability defects.

Planned changes:

- Publish a feature freeze and supported browser, device, hosting, protocol, and scenario-format policies.
- Conduct structured testing with simulation educators and accessibility reviewers using fictional cases only.
- Resolve release-blocking defects and document accepted non-blocking limitations.
- Verify clean installation, upgrade, rollback, scenario migration, hosted-service recovery, and self-host recovery paths.
- Complete operator, instructor, contributor, security, accessibility, and troubleshooting documentation.
- Prepare release notes and a compatibility guide for v1.0.

Release criteria:

- No unresolved release-blocking defects remain.
- The complete instructor-to-monitor, scenario, branching, debrief, collaboration, hosted, and self-hosted workflows pass their acceptance tests.
- The WCAG 2.2 AA target is re-audited for the defined workflows and all documented exceptions have mitigations.

## v1.0.0: Stable Education Suite

Goal: provide a stable, accessible, broadly useful education suite that works immediately online and remains practical to self-host.

Release guarantees:

- The monitor, portable scenarios, playback, branching, debrief, browser-local scenario library, and session collaboration are supported product workflows.
- The official hosted instance and documented self-hosted deployments run the same core application and protocol.
- Verified basic accounts are required only for instructor session creation on the official public service; monitors remain anonymous and self-hosted deployments may disable authentication.
- Supported protocol and scenario versions, compatibility expectations, security support, and upgrade paths are documented.
- Accessibility, reliability, performance, deployment, and educator acceptance gates from v0.9.0 remain satisfied.
- The training-only limitation and prohibition on real patient data remain prominent in the application and documentation.

Not required for v1.0 unless a later architectural decision explicitly promotes them:

- Organizations, advanced profiles and roles, account administration, and single sign-on.
- Hosted personal scenario storage or a public scenario marketplace.
- Twelve-lead acquisition and review.
- Ventilator, CPR-feedback, manikin, or other simulated-device modules.
- Native applications or required proprietary hardware.
- Hardware integrations and community plugin APIs.

## Planned Contract And Architecture Evolution

Future implementation work described above is expected to add runtime-validated contracts for:

- Scenario format versions, compatibility, and migration results.
- Public runtime authentication configuration, Firebase identity tokens, and structured authentication failures.
- Server-only usage records, retention timestamps, and optional usage-recorder boundaries.
- Scenario playback state, effective timestamps, actions, and instructor overrides.
- Branch definitions, selection commands, confirmation requirements, and debrief events.
- Scoped co-instructor and observer credentials, permissions, revocation, and attribution.
- Protocol compatibility negotiation and structured incompatible-version results.
- Browser-local libraries and optional deployment-provided collections behind explicit ownership and persistence boundaries.

These additions must preserve server-authoritative session state, command authorization, monotonic revisions, complete snapshot recovery, and provider-independent domain interfaces.

## Post-v1 Direction

Possible work after the stable education suite includes organizations, advanced account administration, hosted sharing, progressive web app behavior, twelve-lead review, additional simulated devices, carefully scoped hardware integrations, and community-developed modules. These features should be promoted only through explicit architectural and product decisions; they are not hidden requirements for v1.0.
