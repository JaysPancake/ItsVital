import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router";
import {
  type BloodPressure,
  type CommandApplyResult,
  type InstructorCommand,
  type MonitorControlMode,
  protocolVersion,
  type SessionCreateResult,
  type SessionJoinResult,
  type SessionSnapshot,
} from "@itsvital/protocol";
import { sampleCapnography, samplePleth, sampleSinusEcg } from "@itsvital/waveforms";
import { WaveformCanvas } from "../components/WaveformCanvas";
import { getSocket } from "../infrastructure/socket";

const instructorTokenKey = (sessionId: string) => `itsvital.instructor.${sessionId}`;
const instructorJoinCodeKey = (sessionId: string) => `itsvital.joinCode.${sessionId}`;

function Home() {
  return (
    <main className="home">
      <p className="status">v0.0.2</p>
      <h1>ItsVital</h1>
      <p>Browser-based patient-monitor simulation for education and training.</p>
      <nav aria-label="Simulation roles">
        <Link to="/instructor">Instructor</Link>
        <Link to="/monitor">Monitor</Link>
      </nav>
      <TrainingWarning />
    </main>
  );
}

function TrainingWarning() {
  return (
    <p className="warning" role="note">
      Training tool only. Not for patient care or clinical decisions.
    </p>
  );
}

function InstructorCreate() {
  const navigate = useNavigate();
  const hasCreated = useRef(false);
  const [message, setMessage] = useState("Creating instructor session...");

  useEffect(() => {
    if (hasCreated.current) {
      return;
    }

    hasCreated.current = true;
    const socket = getSocket();

    socket.emit("session:create", { protocolVersion }, (result: SessionCreateResult) => {
      if (!result.ok) {
        setMessage(result.error.message);
        return;
      }

      localStorage.setItem(instructorTokenKey(result.sessionId), result.instructorToken);
      localStorage.setItem(instructorJoinCodeKey(result.sessionId), result.joinCode);
      navigate(`/instructor/${result.sessionId}`, { replace: true });
    });
  }, [navigate]);

  return (
    <main>
      <p className="status">Instructor</p>
      <h1>New session</h1>
      <p>{message}</p>
      <TrainingWarning />
    </main>
  );
}

function InstructorSession() {
  const { sessionId } = useParams();
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const instructorToken = sessionId ? localStorage.getItem(instructorTokenKey(sessionId)) : null;
  const joinCode = sessionId ? localStorage.getItem(instructorJoinCodeKey(sessionId)) : null;

  useEffect(() => {
    if (!sessionId || !instructorToken) {
      return;
    }

    const socket = getSocket();
    const join = () => {
      socket.emit(
        "session:join",
        { protocolVersion, role: "instructor", sessionId, instructorToken },
        (result: SessionJoinResult) => {
          if (result.ok) {
            setSnapshot(result.snapshot);
            setError(null);
          } else {
            setError(result.error.message);
          }
        },
      );
    };
    const handleSnapshot = (nextSnapshot: SessionSnapshot) => {
      if (nextSnapshot.sessionId === sessionId) {
        setSnapshot(nextSnapshot);
      }
    };
    const handleConnect = () => {
      setIsConnected(true);
      join();
    };
    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("session:snapshot", handleSnapshot);

    if (socket.connected) {
      queueMicrotask(handleConnect);
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("session:snapshot", handleSnapshot);
    };
  }, [instructorToken, sessionId]);

  if (!sessionId || !instructorToken) {
    return (
      <main>
        <p className="status">Instructor</p>
        <h1>Session unavailable</h1>
        <p>This browser does not have the instructor credential for that session.</p>
        <Link to="/instructor">Create a new session</Link>
        <TrainingWarning />
      </main>
    );
  }

  const applyCommand = (command: InstructorCommand) => {
    const socket = getSocket();

    socket.emit(
      "command:apply",
      { protocolVersion, sessionId, instructorToken, command },
      (result: CommandApplyResult) => {
        if (result.ok) {
          setSnapshot(result.snapshot);
          setError(null);
        } else {
          setError(result.error.message);
        }
      },
    );
  };

  const applyVitalsPatch = (payload: Extract<InstructorCommand, { type: "vitals.patch" }>["payload"]) => {
    applyCommand({ type: "vitals.patch", payload });
  };

  const applyBloodPressure = (bloodPressure: BloodPressure) => {
    applyCommand({ type: "bloodPressure.set", payload: bloodPressure });
  };

  return (
    <main className="workspace">
      <header className="toolbar">
        <div>
          <p className="status">Instructor</p>
          <h1>Session controls</h1>
        </div>
        <ConnectionState isConnected={isConnected} />
      </header>

      {snapshot ? (
        <>
          <section className="session-panel" aria-label="Monitor join details">
            <div>
              <span className="field-label">Monitor join code</span>
              <strong className="join-code" data-testid="join-code">
                {joinCode ?? "Unavailable"}
              </strong>
            </div>
            {joinCode ? (
              <Link to={`/monitor/${joinCode}`} target="_blank" rel="noreferrer">
                Open local monitor view
              </Link>
            ) : null}
          </section>

          <fieldset className="mode-control">
            <legend>Monitor control</legend>
            <label>
              <input
                type="radio"
                name="monitor-control-mode"
                value="instructor-managed"
                checked={snapshot.monitor.controlMode === "instructor-managed"}
                onChange={() =>
                  applyCommand({
                    type: "monitor.controlMode.set",
                    payload: { controlMode: "instructor-managed" },
                  })
                }
              />
              Instructor managed
            </label>
            <label>
              <input
                data-testid="student-operated-mode"
                type="radio"
                name="monitor-control-mode"
                value="student-operated"
                checked={snapshot.monitor.controlMode === "student-operated"}
                onChange={() =>
                  applyCommand({
                    type: "monitor.controlMode.set",
                    payload: { controlMode: "student-operated" },
                  })
                }
              />
              Student operated
            </label>
          </fieldset>

          <section className="control-grid" aria-label="Vital sign controls">
            <NumberControl
              label="Heart rate"
              unit="bpm"
              value={snapshot.patient.heartRate}
              min={20}
              max={250}
              testId="heart-rate-input"
              onCommit={(value) => applyVitalsPatch({ heartRate: value })}
            />
            <NumberControl
              label="SpO2"
              unit="%"
              value={snapshot.patient.spo2}
              min={0}
              max={100}
              onCommit={(value) => applyVitalsPatch({ spo2: value })}
            />
            <NumberControl
              label="Respiratory rate"
              unit="/min"
              value={snapshot.patient.respiratoryRate}
              min={0}
              max={80}
              onCommit={(value) => applyVitalsPatch({ respiratoryRate: value })}
            />
            <NumberControl
              label="EtCO2"
              unit="mmHg"
              value={snapshot.patient.etco2}
              min={0}
              max={100}
              onCommit={(value) => applyVitalsPatch({ etco2: value })}
            />
            <NumberControl
              label="Systolic BP"
              unit="mmHg"
              value={snapshot.patient.bloodPressure.systolic}
              min={40}
              max={260}
              testId="systolic-input"
              onCommit={(value) =>
                applyBloodPressure({ ...snapshot.patient.bloodPressure, systolic: value })
              }
            />
            <NumberControl
              label="Diastolic BP"
              unit="mmHg"
              value={snapshot.patient.bloodPressure.diastolic}
              min={20}
              max={180}
              testId="diastolic-input"
              onCommit={(value) =>
                applyBloodPressure({ ...snapshot.patient.bloodPressure, diastolic: value })
              }
            />
          </section>
          <p className="metadata">Revision {snapshot.revision}. Expires {formatTime(snapshot.expiresAt)}.</p>
        </>
      ) : (
        <p>Joining instructor session...</p>
      )}

      {error ? <p className="error">{error}</p> : null}
      <TrainingWarning />
    </main>
  );
}

interface NumberControlProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  testId?: string;
  onCommit(value: number): void;
}

function NumberControl({ label, unit, value, min, max, testId, onCommit }: NumberControlProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const [draft, setDraft] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const displayedValue = isEditing ? draft : String(value);

  const reset = () => {
    setDraft(String(value));
    setIsEditing(false);
    setError(null);
  };

  const commit = (event?: FocusEvent<HTMLInputElement>) => {
    const nextValue = Number(draft);

    if (draft.trim() === "" || !Number.isInteger(nextValue)) {
      setError(`${label} must be a whole number.`);
      event?.currentTarget.focus();
      return;
    }

    if (nextValue < min || nextValue > max) {
      setError(`${label} must be between ${min} and ${max}.`);
      event?.currentTarget.focus();
      return;
    }

    setIsEditing(false);
    setError(null);

    if (nextValue !== value) {
      onCommit(nextValue);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      reset();
    }
  };

  return (
    <label className="number-control">
      <span id={inputId}>
        {label} <small>{unit}</small>
      </span>
      <input
        data-testid={testId}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={displayedValue}
        aria-labelledby={inputId}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? errorId : undefined}
        onFocus={() => {
          setDraft(String(value));
          setIsEditing(true);
          setError(null);
        }}
        onChange={(event) => {
          setDraft(event.currentTarget.value);
          setIsEditing(true);
          setError(null);
        }}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
      {error ? (
        <small id={errorId} className="control-error">
          {error}
        </small>
      ) : null}
    </label>
  );
}

function MonitorEntry() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");

  return (
    <main>
      <p className="status">Monitor</p>
      <h1>Join session</h1>
      <form
        className="join-form"
        onSubmit={(event) => {
          event.preventDefault();
          navigate(`/monitor/${joinCode.trim().toUpperCase()}`);
        }}
      >
        <label className="number-control">
          <span>Monitor join code</span>
          <input
            value={joinCode}
            onChange={(event) => setJoinCode(event.currentTarget.value)}
            autoComplete="off"
          />
        </label>
        <button type="submit">Join</button>
      </form>
      <TrainingWarning />
    </main>
  );
}

type MonitorChannel = "ecg" | "pleth" | "capnography";
type SweepSpeed = 12.5 | 25 | 50;
type WaveformGain = 0.5 | 1 | 2;

const initialStudentChannels: Record<MonitorChannel, boolean> = {
  ecg: false,
  pleth: false,
  capnography: false,
};

const initialGains: Record<MonitorChannel, WaveformGain> = {
  ecg: 1,
  pleth: 1,
  capnography: 1,
};

function MonitorSession() {
  const { sessionCode } = useParams();
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sweepSpeed, setSweepSpeed] = useState<SweepSpeed>(25);
  const [showGrid, setShowGrid] = useState(true);
  const [gains, setGains] = useState(initialGains);
  const [studentChannels, setStudentChannels] = useState(initialStudentChannels);
  const [capturedBloodPressure, setCapturedBloodPressure] = useState<BloodPressure | null>(null);
  const previousControlMode = useRef<MonitorControlMode | null>(null);

  useEffect(() => {
    if (!sessionCode) {
      return;
    }

    const socket = getSocket();
    const joinCode = sessionCode.toUpperCase();
    const join = () => {
      socket.emit(
        "session:join",
        { protocolVersion, role: "monitor", joinCode },
        (result: SessionJoinResult) => {
          if (result.ok) {
            setSnapshot(result.snapshot);
            setError(null);
          } else {
            setError(result.error.message);
          }
        },
      );
    };
    const handleSnapshot = (nextSnapshot: SessionSnapshot) => {
      setSnapshot(nextSnapshot);
    };
    const handleExpired = () => {
      setError("Session has expired.");
    };
    const handleConnect = () => {
      setIsConnected(true);
      join();
    };
    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("session:snapshot", handleSnapshot);
    socket.on("session:expired", handleExpired);

    if (socket.connected) {
      queueMicrotask(handleConnect);
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("session:snapshot", handleSnapshot);
      socket.off("session:expired", handleExpired);
    };
  }, [sessionCode]);

  useEffect(() => {
    const controlMode = snapshot?.monitor.controlMode;

    if (!controlMode) {
      return;
    }

    if (
      controlMode === "student-operated" &&
      previousControlMode.current !== "student-operated"
    ) {
      setStudentChannels(initialStudentChannels);
      setCapturedBloodPressure(null);
    }

    previousControlMode.current = controlMode;
  }, [snapshot?.monitor.controlMode]);

  const heartRate = snapshot?.patient.heartRate ?? 80;
  const spo2 = snapshot?.patient.spo2 ?? 98;
  const respiratoryRate = snapshot?.patient.respiratoryRate ?? 16;
  const etco2 = snapshot?.patient.etco2 ?? 35;
  const ecgSampler = useMemo(
    () => (timeSeconds: number) => sampleSinusEcg({ heartRate, timeSeconds }),
    [heartRate],
  );
  const plethSampler = useMemo(
    () => (timeSeconds: number) => samplePleth({ heartRate, spo2, timeSeconds }),
    [heartRate, spo2],
  );
  const capnographySampler = useMemo(
    () => (timeSeconds: number) =>
      sampleCapnography({ respiratoryRate, etco2, timeSeconds }),
    [etco2, respiratoryRate],
  );

  const setGain = (channel: MonitorChannel, gain: WaveformGain) => {
    setGains((current) => ({ ...current, [channel]: gain }));
  };

  const toggleStudentChannel = (channel: MonitorChannel) => {
    setStudentChannels((current) => ({ ...current, [channel]: !current[channel] }));
  };

  const isChannelActive = (channel: MonitorChannel) =>
    snapshot?.monitor.controlMode === "instructor-managed" || studentChannels[channel];

  return (
    <main className="monitor-shell">
      <header className="monitor-header">
        <div>
          <p className="status">Monitor</p>
          <h1>ItsVital</h1>
        </div>
        <ConnectionState isConnected={isConnected} />
      </header>

      {snapshot ? (
        <>
          <DisplayControls
            gains={gains}
            showGrid={showGrid}
            sweepSpeed={sweepSpeed}
            onGainChange={setGain}
            onGridChange={setShowGrid}
            onSweepSpeedChange={setSweepSpeed}
          />

          {snapshot.monitor.controlMode === "student-operated" ? (
            <section className="student-controls" aria-label="Student monitor controls">
              {(["ecg", "pleth", "capnography"] as const).map((channel) => (
                <button
                  key={channel}
                  type="button"
                  aria-pressed={studentChannels[channel]}
                  onClick={() => toggleStudentChannel(channel)}
                >
                  {studentChannels[channel] ? "Disconnect" : "Activate"} {channelLabel(channel)}
                </button>
              ))}
              <button
                type="button"
                data-testid="nibp-capture"
                onClick={() => setCapturedBloodPressure({ ...snapshot.patient.bloodPressure })}
              >
                Measure NIBP
              </button>
            </section>
          ) : null}

          <section className="monitor-display" aria-label="Displayed waveforms and vital signs">
            <WaveformRow
              active={isChannelActive("ecg")}
              channel="ecg"
              color="#41f294"
              gain={gains.ecg}
              label="ECG II"
              numericLabel="Heart rate"
              numericTestId="monitor-heart-rate"
              numericUnit="bpm"
              numericValue={snapshot.patient.heartRate}
              sampler={ecgSampler}
              showGrid={showGrid}
              sweepSpeed={sweepSpeed}
            />
            <WaveformRow
              active={isChannelActive("pleth")}
              baselineRatio={0.82}
              channel="pleth"
              color="#56c8ff"
              gain={gains.pleth}
              label="Pleth"
              numericLabel="SpO2"
              numericUnit="%"
              numericValue={snapshot.patient.spo2}
              sampler={plethSampler}
              showGrid={showGrid}
              sweepSpeed={sweepSpeed}
            />
            <WaveformRow
              active={isChannelActive("capnography")}
              baselineRatio={0.86}
              channel="capnography"
              color="#f2d15f"
              gain={gains.capnography}
              label="CO2"
              numericLabel="EtCO2"
              numericUnit="mmHg"
              numericValue={snapshot.patient.etco2}
              sampler={capnographySampler}
              secondaryLabel="Respiratory rate"
              secondaryUnit="/min"
              secondaryValue={snapshot.patient.respiratoryRate}
              showGrid={showGrid}
              sweepSpeed={sweepSpeed}
            />
          </section>

          <section className="monitor-summary" aria-label="Non-invasive blood pressure">
            <VitalDisplay
              label="NIBP"
              value={
                snapshot.monitor.controlMode === "instructor-managed"
                  ? `${snapshot.patient.bloodPressure.systolic}/${snapshot.patient.bloodPressure.diastolic}`
                  : capturedBloodPressure
                    ? `${capturedBloodPressure.systolic}/${capturedBloodPressure.diastolic}`
                    : "--/--"
              }
              unit="mmHg"
              compact
              testId="monitor-blood-pressure"
            />
          </section>
          <p className="metadata">Revision {snapshot.revision}. Expires {formatTime(snapshot.expiresAt)}.</p>
        </>
      ) : (
        <p>Joining monitor session...</p>
      )}

      {error ? <p className="error">{error}</p> : null}
      <TrainingWarning />
    </main>
  );
}

function DisplayControls({
  gains,
  showGrid,
  sweepSpeed,
  onGainChange,
  onGridChange,
  onSweepSpeedChange,
}: {
  gains: Record<MonitorChannel, WaveformGain>;
  showGrid: boolean;
  sweepSpeed: SweepSpeed;
  onGainChange(channel: MonitorChannel, gain: WaveformGain): void;
  onGridChange(showGrid: boolean): void;
  onSweepSpeedChange(speed: SweepSpeed): void;
}) {
  return (
    <section className="display-controls" aria-label="Waveform display controls">
      <fieldset>
        <legend>Sweep speed</legend>
        {[12.5, 25, 50].map((speed) => (
          <label key={speed}>
            <input
              type="radio"
              name="sweep-speed"
              checked={sweepSpeed === speed}
              onChange={() => onSweepSpeedChange(speed as SweepSpeed)}
            />
            {speed} mm/s
          </label>
        ))}
      </fieldset>
      <label className="grid-toggle">
        <input
          data-testid="grid-toggle"
          type="checkbox"
          checked={showGrid}
          onChange={(event) => onGridChange(event.currentTarget.checked)}
        />
        Grid
      </label>
      {(["ecg", "pleth", "capnography"] as const).map((channel) => (
        <label key={channel}>
          {channelLabel(channel)} gain
          <select
            aria-label={`${channelLabel(channel)} gain`}
            value={gains[channel]}
            onChange={(event) => onGainChange(channel, Number(event.currentTarget.value) as WaveformGain)}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
          </select>
        </label>
      ))}
    </section>
  );
}

function WaveformRow({
  active,
  baselineRatio,
  channel,
  color,
  gain,
  label,
  numericLabel,
  numericTestId,
  numericUnit,
  numericValue,
  sampler,
  secondaryLabel,
  secondaryUnit,
  secondaryValue,
  showGrid,
  sweepSpeed,
}: {
  active: boolean;
  baselineRatio?: number;
  channel: MonitorChannel;
  color: string;
  gain: WaveformGain;
  label: string;
  numericLabel: string;
  numericTestId?: string;
  numericUnit: string;
  numericValue: number;
  sampler(timeSeconds: number): number;
  secondaryLabel?: string;
  secondaryUnit?: string;
  secondaryValue?: number;
  showGrid: boolean;
  sweepSpeed: SweepSpeed;
}) {
  return (
    <article className={`waveform-row waveform-row-${channel}`}>
      <div className="waveform-trace">
        <div className="waveform-label">
          <strong>{label}</strong>
          <span>{active ? `${sweepSpeed} mm/s / ${gain}x` : "Unavailable"}</span>
        </div>
        <WaveformCanvas
          active={active}
          baselineRatio={baselineRatio}
          color={color}
          gain={gain}
          label={label}
          sampler={sampler}
          showGrid={showGrid}
          sweepSpeed={sweepSpeed}
          testId={`${channel}-waveform`}
        />
      </div>
      <div className="channel-values" style={{ color }}>
        <span>{numericLabel}</span>
        <strong data-testid={numericTestId}>{active ? numericValue : "--"}</strong>
        <small>{numericUnit}</small>
        {secondaryLabel && secondaryUnit && secondaryValue !== undefined ? (
          <div className="secondary-vital">
            <span>{secondaryLabel}</span>
            <strong>{active ? secondaryValue : "--"}</strong>
            <small>{secondaryUnit}</small>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function channelLabel(channel: MonitorChannel) {
  switch (channel) {
    case "ecg":
      return "ECG";
    case "pleth":
      return "SpO2";
    case "capnography":
      return "CO2";
  }
}

function VitalDisplay({
  label,
  value,
  unit,
  testId,
  compact = false,
}: {
  label: string;
  value: number | string;
  unit: string;
  testId?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "vital vital-compact" : "vital"}>
      <span>{label}</span>
      <strong data-testid={testId}>{value}</strong>
      <small>{unit}</small>
    </div>
  );
}

function ConnectionState({ isConnected }: { isConnected: boolean }) {
  return (
    <p className={isConnected ? "connection connected" : "connection disconnected"}>
      {isConnected ? "Connected" : "Disconnected"}
    </p>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/instructor" element={<InstructorCreate />} />
      <Route path="/instructor/:sessionId" element={<InstructorSession />} />
      <Route path="/monitor" element={<MonitorEntry />} />
      <Route path="/monitor/:sessionCode" element={<MonitorSession />} />
    </Routes>
  );
}
