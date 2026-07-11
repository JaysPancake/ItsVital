# ItsVital

**ItsVital** is a free and open-source, web-based patient monitor simulation platform designed for EMS, nursing, respiratory, and medical education.

Its goal is simple: **turn any device with a browser into a realistic training monitor—no hardware required.**

---

## 🚑 Why ItsVital?

Simulation tools are often:
- expensive
- hardware-dependent
- difficult to deploy

ItsVital removes those barriers by being:

- 🌐 **Fully web-based**
- 💸 **100% free and open source**
- 📱 **Device-agnostic (iPad, laptop, phone, projector)**
- ⚡ **Quick to set up and use in real classrooms**

---

## 🧠 How It Works

ItsVital uses a simple instructor + monitor model:

1. Instructor creates a session
2. Learners open a monitor on another device
3. Both connect using a session code
4. Instructor controls vitals in real-time
5. Learners interact with a live simulated monitor

No installs. No proprietary equipment.

---

## 🎯 Features (💡 Planned / 🚧 In Progress / ⭐ Complete)

### Core (v0.0.1)
- Live vital signs monitoring:
  - 💡 Heart rate
  - 💡 SpO₂
  - 💡 Respiratory rate
  - 💡 Blood pressure (NIBP)
  - 💡 ETCO₂
- Waveforms:
  - 💡 ECG
  - 💡 Pleth
  - 💡 Capnography
  - 💡 12 Leads
- 💡 Instructor control panel
- 💡 Real-time synchronization (WebSockets)
- 💡 Session join codes
- 💡 Fullscreen monitor display
- 💡 Basic alarm system

### Coming Soon
- Scenario system (JSON-based cases)
- Rhythm switching
- Event timeline + logging
- Save/load training scenarios
- Improved waveform realism
- Offline/PWA support

---

## 🚫 Scope (For Now)

ItsVital intentionally **does NOT** include:

- Native monitor hardware support
- CPR feedback devices
- Ventilator or manikin integrations
- Proprietary simulation hardware

This keeps the platform simple, accessible, and easy to deploy.

---

## 🛠 Tech Stack

**Frontend**
- React + TypeScript
- Vite
- Tailwind CSS

**Backend**
- Node.js
- Express / Fastify
- Socket.IO (real-time sync)

**Other**
- Web Audio API (alarms)
- Canvas/SVG (waveforms)

---

## 🚀 Getting Started (Planned)

# Clone the repo
git clone https://github.com/JaysPancake/ItsVital.git

cd ItsVital

# Install dependencies
npm install

# Start development servers
npm run dev

> ⚠️ Setup instructions will evolve as the project is built.

---

## 📦 Project Structure (Planned)

itsvital/
  apps/
    web/        # Frontend (monitor + instructor UI)
    server/     # Backend + WebSocket server
  packages/
    ui/
    waveform-engine/
    scenario-schema/

---

## 🤝 Contributing

Contributions are welcome — especially from:

- EMS providers
- paramedics
- nurses
- educators
- developers

Ways to contribute:
- Open issues
- Suggest features
- Submit pull requests
- Create training scenarios
- Improve documentation

Please check for:
- `CONTRIBUTING.md` (coming soon)
- `good first issue` labels

---

## ⚖️ License

This project is licensed under the **MIT License**.

You are free to:
- use
- modify
- distribute

Just include the original license.

---

## ⚠️ Disclaimer

ItsVital is a **training tool only**.

It is **not intended for real patient care or clinical decision-making.**

---

## 💡 Vision

ItsVital aims to become the go-to open platform for simulation-based education by being:

- accessible to everyone
- easy to use in real classrooms
- flexible for instructors
- built by the community

---

## ⭐ Support the Project

If you find this useful:

- ⭐ Star the repo
- 🧠 Contribute ideas
- 🛠 Submit PRs
- 📢 Share with educators
