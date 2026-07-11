import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router";
import {
  type BloodPressure,
  type CommandApplyResult,
  type InstructorCommand,
  protocolVersion,
  type SessionCreateResult,
  type SessionJoinResult,
  type SessionSnapshot,
} from "@itsvital/protocol";
import { WaveformCanvas } from "../components/WaveformCanvas";
import { getSocket } from "../infrastructure/socket";

const instructorTokenKey = (sessionId: string) => `itsvital.instructor.${sessionId}`;
const instructorJoinCodeKey = (sessionId: string) => `itsvital.joinCode.${sessionId}`;

const parseNumber = (event: ChangeEvent<HTMLInputElement>) => Number(event.currentTarget.value);

function Home() {
  return (
    <main className="home">
      <p className="status">v0.0.1</p>
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
            {joinCode ? <Link to={`/monitor/${joinCode}`}>Open local monitor view</Link> : null}
          </section>

          <section className="control-grid" aria-label="Vital sign controls">
            <NumberControl
              label="Heart rate"
              unit="bpm"
              value={snapshot.patient.heartRate}
              min={20}
              max={250}
              testId="heart-rate-input"
              onChange={(value) => applyVitalsPatch({ heartRate: value })}
            />
            <NumberControl
              label="SpO2"
              unit="%"
              value={snapshot.patient.spo2}
              min={0}
              max={100}
              onChange={(value) => applyVitalsPatch({ spo2: value })}
            />
            <NumberControl
              label="Respiratory rate"
              unit="/min"
              value={snapshot.patient.respiratoryRate}
              min={0}
              max={80}
              onChange={(value) => applyVitalsPatch({ respiratoryRate: value })}
            />
            <NumberControl
              label="EtCO2"
              unit="mmHg"
              value={snapshot.patient.etco2}
              min={0}
              max={100}
              onChange={(value) => applyVitalsPatch({ etco2: value })}
            />
            <NumberControl
              label="Systolic BP"
              unit="mmHg"
              value={snapshot.patient.bloodPressure.systolic}
              min={40}
              max={260}
              onChange={(value) =>
                applyBloodPressure({ ...snapshot.patient.bloodPressure, systolic: value })
              }
            />
            <NumberControl
              label="Diastolic BP"
              unit="mmHg"
              value={snapshot.patient.bloodPressure.diastolic}
              min={20}
              max={180}
              onChange={(value) =>
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
  onChange(value: number): void;
}

function NumberControl({ label, unit, value, min, max, testId, onChange }: NumberControlProps) {
  return (
    <label className="number-control">
      <span>
        {label} <small>{unit}</small>
      </span>
      <input
        data-testid={testId}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(parseNumber(event))}
      />
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

function MonitorSession() {
  const { sessionCode } = useParams();
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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
          <WaveformCanvas heartRate={snapshot.patient.heartRate} />
          <section className="vital-grid" aria-label="Displayed vital signs">
            <VitalDisplay label="Heart rate" value={snapshot.patient.heartRate} unit="bpm" testId="monitor-heart-rate" />
            <VitalDisplay label="SpO2" value={snapshot.patient.spo2} unit="%" />
            <VitalDisplay label="Respiratory rate" value={snapshot.patient.respiratoryRate} unit="/min" />
            <VitalDisplay
              label="NIBP"
              value={`${snapshot.patient.bloodPressure.systolic}/${snapshot.patient.bloodPressure.diastolic}`}
              unit="mmHg"
            />
            <VitalDisplay label="EtCO2" value={snapshot.patient.etco2} unit="mmHg" />
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

function VitalDisplay({
  label,
  value,
  unit,
  testId,
}: {
  label: string;
  value: number | string;
  unit: string;
  testId?: string;
}) {
  return (
    <div className="vital">
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
