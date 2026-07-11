import { Link, Route, Routes } from "react-router";

function Home() {
  return (
    <main>
      <p className="status">Pre-alpha</p>
      <h1>ItsVital</h1>
      <p>Browser-based patient-monitor simulation for education and training.</p>
      <nav aria-label="Simulation roles">
        <Link to="/instructor">Instructor</Link>
        <Link to="/monitor">Monitor</Link>
      </nav>
      <p className="warning" role="note">
        Training tool only. Not for patient care or clinical decisions.
      </p>
    </main>
  );
}

function Placeholder({ role }: { role: string }) {
  return (
    <main>
      <p className="status">In progress</p>
      <h1>{role}</h1>
      <p>This experience is being built for the first synchronization milestone.</p>
      <Link to="/">Back to role selection</Link>
      <p className="warning" role="note">
        Training tool only. Not for patient care or clinical decisions.
      </p>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/instructor" element={<Placeholder role="Instructor" />} />
      <Route path="/monitor" element={<Placeholder role="Monitor" />} />
    </Routes>
  );
}
