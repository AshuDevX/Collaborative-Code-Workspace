# 🚀 CodeCollab — Real-time Collaborative IDE

<div align="center">

![CodeCollab Banner](https://img.shields.io/badge/CodeCollab-Real--time%20Collaborative%20IDE-7c3aed?style=for-the-badge&logo=visualstudiocode)

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7-010101?style=flat-square&logo=socket.io)](https://socket.io)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-VS_Code_Core-0078d7?style=flat-square&logo=visualstudiocode)](https://microsoft.github.io/monaco-editor/)
[![Docker](https://img.shields.io/badge/Docker-Sandboxed_Execution-2496ED?style=flat-square&logo=docker)](https://docker.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Optional-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)

**A production-grade collaborative coding platform. Code together in real-time — like VS Code Live Share meets Replit.**

</div>

---

## ✨ Features

### 🌐 Real-time Collaboration
- **Live code sync** — every keystroke synced to all collaborators instantly
- **Cursor presence** — see exactly where your teammates are editing, with colored labels
- **User avatars** — online users shown in the top bar and sidebar
- **Join/leave notifications** — toast alerts when collaborators arrive or leave

### 💻 Monaco Editor (VS Code Core)
- Syntax highlighting for **12 languages**: JavaScript, TypeScript, Python, Java, C, C++, Go, Rust, Ruby, PHP, Kotlin, Swift
- IntelliSense auto-complete
- Bracket pair colorization
- Sticky scroll, minimap, multiple cursors
- Custom dark theme with purple accent

### ⚡ Code Execution Engine
- **Docker-sandboxed** execution (no network, memory-capped, read-only FS)
- Falls back to local execution if Docker unavailable
- Real-time streaming output to the terminal panel
- 15-second execution timeout
- All 12 languages supported

### 📁 Virtual File System
- Create, rename, delete files per project
- Multiple open tabs with dirty-state indicators
- Auto-save every 30 seconds + manual Ctrl+S

### 💬 Live Chat
- In-editor chat panel, per-project
- Colored user bubbles, timestamps

### 📸 Version History
- Save named snapshots of your entire project
- Restore any previous snapshot instantly
- Up to 20 snapshots per project

### 🔗 Invite System
- One-click invite link generation
- Share link → anyone with account can join
- JWT-authenticated, room-based isolation

### 🎨 UI / UX
- VS Code–inspired dark theme (default)
- Light/dark toggle
- Framer Motion animations
- Resizable bottom panel (drag to resize)
- JetBrains Mono + Syne fonts
- Fully responsive

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  Browser (React)                │
│  ┌──────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ Sidebar  │ │Monaco Editor │ │Bottom Panel │ │
│  │ (Files,  │ │(Code + Live  │ │(Terminal +  │ │
│  │  Users,  │ │ Cursors)     │ │  Chat)      │ │
│  │ History) │ └──────────────┘ └─────────────┘ │
└──────────────────────┬──────────────────────────┘
                       │ WebSocket (Socket.io)
                       │ REST (Axios)
┌──────────────────────▼──────────────────────────┐
│              Node.js + Express Server            │
│  ┌──────────────────────────────────────────┐   │
│  │          Socket.io Handler               │   │
│  │  • Room management (project = room)      │   │
│  │  • OT-lite conflict resolution           │   │
│  │  • Code execution orchestration         │   │
│  │  • Auto-persist debouncing              │   │
│  └──────────────────────────────────────────┘   │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │  REST API   │  │   Execution Engine       │  │
│  │  /auth      │  │  Docker sandbox (safe)   │  │
│  │  /projects  │  │  Local fallback          │  │
│  └─────────────┘  └──────────────────────────┘  │
└──────────────────────┬──────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼──────┐             ┌────────▼──────┐
│   MongoDB    │             │  Docker Exec  │
│  (optional)  │             │  Containers   │
│  In-memory   │             │  (sandboxed)  │
│  fallback    │             └───────────────┘
└──────────────┘
```

---

## 📦 Project Structure

```
codecollab/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── AuthPage.jsx      # Login/Register
│   │   │   │   └── Dashboard.jsx     # Project list
│   │   │   ├── Editor/
│   │   │   │   ├── Editor.jsx        # Monaco Editor wrapper
│   │   │   │   ├── Workspace.jsx     # Main IDE layout
│   │   │   │   └── StatusBar.jsx     # Bottom status bar
│   │   │   ├── Sidebar/
│   │   │   │   └── Sidebar.jsx       # File explorer, users, history
│   │   │   ├── TopBar/
│   │   │   │   └── TopBar.jsx        # Run, language picker, share
│   │   │   └── Terminal/
│   │   │       └── BottomPanel.jsx   # Terminal + chat
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Auth state + JWT
│   │   │   ├── ProjectContext.jsx    # Project/editor state
│   │   │   └── SocketContext.jsx     # Socket.io connection
│   │   ├── hooks/
│   │   │   └── useCollaboration.js  # All socket event handlers
│   │   ├── utils/
│   │   │   └── languages.js         # Language configs + defaults
│   │   └── styles/
│   │       └── globals.css          # Tailwind + custom styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                    # Node.js backend
│   ├── index.js               # Entry point
│   ├── routes/
│   │   ├── auth.js            # Register/Login
│   │   └── projects.js        # CRUD + invite
│   ├── socket/
│   │   └── handlers.js        # All real-time logic
│   ├── execution/
│   │   └── runner.js          # Docker/local code execution
│   ├── middleware/
│   │   └── auth.js            # JWT middleware
│   ├── models/
│   │   └── index.js           # Mongoose models + in-memory store
│   └── package.json
│
├── docker/
│   ├── docker-compose.yml     # Full stack deployment
│   ├── Dockerfile.app         # App container
│   └── Dockerfile.sandbox     # Execution sandbox docs
│
├── package.json               # Root workspace
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB (optional — falls back to in-memory)
- Docker (optional — required for sandboxed code execution)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/codecollab.git
cd codecollab

# Install all dependencies
npm run install:all
```

### 2. Configure Environment

```bash
# Server config (already has defaults)
cp server/.env.example server/.env
# Edit JWT_SECRET for production!
```

### 3. Start Development Servers

```bash
# Start both client (port 5173) and server (port 3001)
npm run dev
```

Open **http://localhost:5173** — that's it! 🎉

---

## 🔧 Configuration

### Server `.env`
```env
PORT=3001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/codecollab
JWT_SECRET=your-super-secret-key-change-me
CLIENT_URL=http://localhost:5173
```

### Running Without MongoDB
The server automatically falls back to an in-memory store. Data is lost on restart but everything works perfectly for development.

### Code Execution
- **With Docker**: All languages run in isolated containers (recommended)
- **Without Docker**: JavaScript, Python, Go, Ruby, PHP run locally (Node/Python/Go/etc must be installed)
- Languages like Java, C, C++, Rust, Kotlin, Swift **require Docker**

---

## 🐳 Docker Deployment

### Full stack with Docker Compose

```bash
cd docker
docker-compose up --build
```

Access at **http://localhost:3001**

### Pre-pull execution images (speeds up first run)

```bash
docker pull node:20-alpine
docker pull python:3.11-alpine
docker pull golang:1.21-alpine
docker pull ruby:3.2-alpine
docker pull php:8.2-cli-alpine
docker pull openjdk:17-alpine
docker pull gcc:latest
docker pull rust:alpine
```

---

## ☁️ Deployment Guide

### Option A: Railway (Easiest)

1. Push to GitHub
2. Create new project at [railway.app](https://railway.app)
3. Add MongoDB service
4. Set environment variables:
   - `MONGO_URI` → from Railway MongoDB
   - `JWT_SECRET` → random secure string
   - `NODE_ENV` → `production`
   - `CLIENT_URL` → your Railway domain
5. Deploy!

### Option B: Render

**Backend (Web Service)**
- Root: `/server`
- Build: `npm install`
- Start: `node index.js`
- Add env vars from above

**Frontend (Static Site)**
- Root: `/client`
- Build: `npm run build`
- Publish: `dist`
- Set `VITE_API_URL` to your Render backend URL

### Option C: VPS (DigitalOcean / AWS EC2)

```bash
# On server
git clone https://github.com/yourusername/codecollab
cd codecollab/docker
docker-compose up -d

# Setup nginx reverse proxy
sudo apt install nginx
# Configure nginx to proxy localhost:3001
```

---

## 🎮 Usage

### Creating a Project
1. Sign up / log in
2. Click **New Project**
3. Name your project → opens the IDE

### Collaborating
1. Click the **Share** icon in the top bar
2. Copy the invite link
3. Send to teammates
4. They log in and paste the link

### Running Code
1. Select language from the top bar dropdown
2. Write your code
3. Click **▶ Run** (or the button)
4. Output streams to the Terminal panel

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save file |
| `Ctrl+Shift+F` | Format code |
| `Ctrl+/` | Toggle comment |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Alt+Shift+F` | Format selection |

---

## 🧪 Supported Languages

| Language | Runtime | Docker Image |
|----------|---------|--------------|
| JavaScript | Node 20 | `node:20-alpine` |
| TypeScript | ts-node | `node:20-alpine` |
| Python | 3.11 | `python:3.11-alpine` |
| Java | OpenJDK 17 | `openjdk:17-alpine` |
| C | GCC | `gcc:latest` |
| C++ | G++ | `gcc:latest` |
| Go | 1.21 | `golang:1.21-alpine` |
| Rust | 1.74 | `rust:alpine` |
| Ruby | 3.2 | `ruby:3.2-alpine` |
| PHP | 8.2 | `php:8.2-cli-alpine` |
| Kotlin | Latest | `zenika/kotlin:latest` |
| Swift | 5.9 | `swift:5.9-focal` |

---

## 🛡️ Security

- JWT authentication (7-day tokens)
- Docker execution sandbox:
  - `--network=none` — no internet access
  - `--memory=128m` — memory cap
  - `--cpus=0.5` — CPU cap
  - `--pids-limit=64` — process limit
  - `--read-only` — immutable filesystem
  - 12-second execution timeout
  - No privilege escalation

---

## 🤝 Contributing

```bash
# Fork the repo
git checkout -b feature/my-feature
git commit -m "feat: add my feature"
git push origin feature/my-feature
# Open a Pull Request
```

---

## 📄 License

MIT © 2024 CodeCollab

---

<div align="center">
  Built with ❤️ using React, Node.js, Socket.io, and Monaco Editor
</div>
