# ItsVital Plans

This document tracks planned versions and major product directions for ItsVital.
It is intentionally forward-looking: items listed here are not complete unless
the README or release notes for a version explicitly mark them as complete.

ItsVital is a training and simulation tool only. It must never be used for real
patient care, diagnosis, treatment, monitoring, or clinical decision-making.

## Planning Principles

- Protect the instructor-to-monitor synchronization loop before expanding scope.
- Build a useful simulator before building account, organization, or marketplace features.
- Keep monitor behavior clinically recognizable but manufacturer-neutral.
- Keep scenario and branching tools simple enough for instructors to use live.
- Prefer runtime-validated protocol changes before UI-only features.
- Keep waveform generation browser-local; do not stream waveform samples over Socket.IO.
- Document clinical simplifications instead of inventing false precision.

## Current Baseline: v0.0.1

Status: Complete pre-alpha vertical slice.

The current project already supports:

- Temporary instructor-created sessions.
- Short monitor join codes.
- Separate instructor credentials.
- Instructor and monitor routes in one React app.
- Real-time Socket.IO synchronization.
- Server-authoritative state and runtime validation.
- Numeric controls for heart rate, SpO2, respiratory rate, NIBP, and EtCO2.
- One locally generated sinus ECG waveform.
- Monitor reconnect with full current snapshot recovery.
- Automatic session expiration and cleanup.
- Unit tests and a two-browser Playwright workflow.

Known limitations:

- The monitor is still a narrow training slice, not a complete monitor simulation.
- Only sinus ECG is supported.
- Pleth and capnography waveforms are not yet implemented.
- Alarm behavior is not yet implemented.
- NIBP is displayed as a value, not as a measurement cycle.
- Scenario playback and branching instructor workflows are not yet implemented.

## v0.0.2: Monitor Feel And Waveform Stability

Goal: make the existing monitor view feel stable, credible, and alive.

Planned changes:

- Fix current ECG/QRS rendering issues.
- Refactor waveform drawing toward a reusable Canvas 2D renderer shape.
- Add pleth waveform generation and display.
- Add capnography waveform generation and display.
- Add sweep speed and display configuration.
- Improve waveform labels, grid behavior, scaling, and responsive sizing.
- Keep waveform generation framework-independent in `packages/waveforms`.
- Add waveform tests for finite output, timing, and safe boundary handling.
- Allow monitor to choose student/instrutor dependent states. (Whether the student must press an NIBP button, or activate on their end vitals, or if this is all managed and displayed by instructor.)

Release criteria:

- Typecheck, lint, unit tests, and e2e tests pass.
- ECG, pleth, and capnography render without obvious blanking or layout issues.
- Waveforms remain local to the browser and are not streamed from the server.

## v0.0.3: Basic Alarms And Instructor Ergonomics

Goal: make the app useful for short live training moments.

Planned changes:

- Add runtime-validated alarm threshold state.
- Add visible alarm states for supported vital signs.
- Add original, manufacturer-neutral alarm audio.
- Add alarm silence or mute state with unmistakable visual indication.
- Add instructor controls for alarm limits and mute state.
- Improve connection and session state messaging.
- Improve instructor vital controls for fast live adjustment.
- Prevent obvious impossible values in the UI while preserving server validation.

Release criteria:

- Alarm state is visible and not communicated by color alone.
- Alarm threshold and mute behavior have unit coverage.
- E2E coverage confirms a monitor-visible alarm after an instructor change.

## v0.0.4: NIBP, Trends, And Event Log

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

## v0.0.5: Rhythm And Artifact Expansion

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

## v0.1.0: Scenario System

Goal: let instructors prepare and run simple planned scenarios.

Planned changes:

- Add a runtime-validated scenario schema.
- Add timeline actions for vitals, rhythm, alarms, NIBP, and wait steps.
- Add scenario pause, resume, and stop controls.
- Add local load/save for scenario JSON.
- Add fictional example scenarios.
- Add scenario validation with useful error messages.
- Allow live instructor overrides during scenario playback.

Release criteria:

- Scenario schemas have valid and invalid fixture tests.
- Scenario timing, pause, resume, and manual override behavior are tested.
- E2E coverage runs a minimal scenario and confirms monitor updates.

## v0.1.x: Branching Instructor Workflow

Goal: let instructors prepare likely next states and choose a path based on learner decisions.

This is the planned home for the workflow where an instructor can preset the
next patient state, rhythm, or monitor behavior, then choose between branches
such as "student made the correct call" and "student made an error."

Early concept:

- An instructor prepares two or more possible next states before or during a scenario.
- Each branch can include vitals, rhythm, alarms, NIBP behavior, and optional instructor notes.
- The instructor chooses a branch live when learners act.
- The selected branch applies through the same validated command path as manual controls.
- Branches may later be sent to students as feedback, prompts, or debrief material.

Initial branch types:

- Correct action branch.
- Delayed action branch.
- Incorrect action branch.
- Deterioration branch.
- Improvement branch.

Possible workflow:

1. Instructor starts or loads a scenario.
2. Instructor sees the current state and one or more prepared next-state options.
3. Learners make an assessment, intervention, or decision.
4. Instructor selects the branch that matches learner performance.
5. ItsVital applies the planned vitals, rhythm, alarm, and monitor changes.
6. The event log records the selected branch for later debrief.

Design constraints:

- Branch selection should remain fast enough for live instruction.
- Branches should not bypass server validation or authorization.
- Branch data should use the same protocol concepts as normal instructor commands.
- Branch labels and notes must use fictional educational content only.
- The first version should favor two clear choices over a complex flowchart builder.

Later expansion:

- Branch templates for common scenario decision points.
- Multi-step branching scenario trees.
- Student-facing prompts or feedback after instructor approval.
- Debrief view showing learner decisions and instructor-selected branches.
- Scenario authoring tools for reusable branching cases.

Open questions:

- Should branches apply immediately, or support a short countdown/confirm step?
- Should branches be attached to timeline steps, or available globally as quick actions?
- Should student-facing branch feedback be sent during the scenario or saved for debrief?
- How much free-text narrative belongs in ItsVital versus a separate lesson plan?

## v0.1.x: Packaging And Self-Hosting

Goal: make the project easier for other educators and contributors to run.

Planned changes:

- Add production deployment documentation.
- Add Docker or container examples if the support burden is acceptable.
- Document environment variables for ports, origins, and session expiration.
- Add sensible rate limits and payload limits.
- Clarify health and readiness endpoints.
- Add CI coverage for build, typecheck, lint, unit tests, and e2e tests.
- Add a dedicated contributing guide.

Release criteria:

- A fresh clone can follow README setup successfully.
- Production or container instructions are tested before being documented as supported.
- No credentials, real patient information, or protected assets are included.

## v0.2.0: Optional Persistence

Goal: support longer-running and reusable work without making the core app heavy.

Planned changes:

- Keep in-memory sessions as the default development path.
- Refine the session store interface if needed.
- Add an optional persistence adapter only when the scenario and deployment needs justify it.
- Support saved scenario libraries.
- Support cleanup and expiration behavior across persistence.
- Document data ownership and migration expectations.

Not planned for this phase unless a later decision changes scope:

- Accounts and organizations as a hard requirement.
- Vendor lock-in to a specific hosted backend.
- Real patient data storage.

## Long-Term Direction

Possible future work:

- Accounts and organizations.
- Shared scenario libraries.
- Collaborative instructors.
- Debrief timelines and exports.
- Progressive Web App support.
- Twelve-lead acquisition and review.
- Additional simulated devices or monitor modes.
- Carefully scoped hardware integrations.
- Community-developed simulation modules.

These should come after the core monitor, alarm, scenario, and instructor
workflow experience is strong enough to be useful by itself.
