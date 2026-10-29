# NexusFlow Suite — Autonomous AI Video Production & YouTube Automation

<p align="center">
  <img src="NexusFlow%20Core%20App/icon.png" width="130" alt="NexusFlow Logo">
</p>

<p align="center">
  <strong>The Complete Antigravity & Electron Automation Ecosystem for Google Flow, Playwright, YouTube Studio, and Multi-Agent Production.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Cross--Platform-blue?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/Runtime-Node.js%20%2B%20Python-green?style=flat-square" alt="Runtime">
  <img src="https://img.shields.io/badge/Automation-Playwright%20%2B%20Electron-orange?style=flat-square" alt="Automation">
  <img src="https://img.shields.io/badge/Protocol-Model%20Context%20Protocol%20(MCP)-purple?style=flat-square" alt="MCP">
</p>

---

## 🌌 Overview

**NexusFlow Suite** is an end-to-end automated content engine designed to run 24/7 autonomous video generation, optimization, and publishing workflows:
- **Generates AI videos** via Google Flow (`labs.google/fx/tools/flow`) with automated credit tracking and multi-account switching.
- **Assembles & Merges** clips losslessly using FFmpeg into vertical 9:16 Shorts or 16:9 full-length videos.
- **Synthesizes Algorithmic SEO** (Titles, Descriptions, Tags, Retention hooks) calibrated for the YouTube algorithm.
- **Uploads & Publishes** directly to YouTube Studio via Playwright browser automation or YouTube Data API.
- **Exposes MCP Servers** for direct control from Google Antigravity, Claude, and AI Agent workflows.

---

## 📁 Repository Modules & Tools

| Module / Directory | Description | Primary Tech |
|---|---|---|
| **`All In One Antigravity Suite`** | Master pipeline orchestrator, GUI Log Auditor (`:4900`), and CLI runner connecting all tools. | Node.js, Express, MCP |
| **`NexusFlow Core App`** | Google Flow automation engine, multi-account credit manager, prompt queuing, and UI. | Electron, Playwright |
| **`NexusFlow YouTube Uploader`** | Dedicated YouTube Studio video uploader with probe, queueing, and headless browser automation. | Electron, Playwright |
| **`NexusFlow Google Drive - Bones of Empires`** | Google Drive sync bridge, episode cloud archive, and remote asset management. | Node.js, Google Drive API |
| **`NexusFlow YouTube Publisher`** | YouTube Data API v3 direct upload & metadata publishing integration. | Node.js, Python, YouTube API |
| **`NexusFlow YouTube Studio Monitor & Manager`** | Live dashboard monitoring studio status, queue progress, and upload logs. | Node.js, Express |
| **`YouTube SEO & Trends`** | Algorithmic SEO optimization engine, viral title synthesis, and tag generator. | Node.js, AI Prompts |
| **`YouTube Channel History & Ledger`** | Persistent channel memory, video performance ledger, and episode tracker. | Node.js, JSON Ledger |
| **`Claude YouTube Creator Suite`** | Claude AI plugin and skills bundle for creator ideation and scriptwriting. | Claude Plugin, Python |
| **`YouTube Creator Skills Suite`** | Full library of creator skills + interactive Vite web documentation portal. | TypeScript, Vite, React |
| **`Youtube Studio`** | YouTube Studio automation utilities and session manager. | Node.js, Playwright |

---

## 🚀 Quick Start Guide

### Prerequisites
1. **Node.js**: v18+ or v20+ recommended.
2. **Python**: v3.10+ (for Python-based execution scripts).
3. **FFmpeg**: Installed and available in your system `PATH`.

---

### 1. Master Suite Setup & Launch
To launch the master orchestration server and GUI Log Auditor:

```bash
cd "All In One Antigravity Suite"
npm install
npm start
```
* The GUI Auditor will be available at **`http://127.0.0.1:4900`**.

---

### 2. Running NexusFlow Core (Google Flow Automator)
To run the Google Flow generation desktop app:

```bash
cd "NexusFlow Core App"
npm install
npx playwright install chromium
npm start
```

---

### 3. Running NexusFlow YouTube Uploader
To run the automated YouTube Studio uploader:

```bash
cd "NexusFlow YouTube Uploader"
npm install
npx playwright install chromium
npm start
```

---

### 4. Running Creator Skills Portal
To preview the interactive documentation portal:

```bash
cd "YouTube Creator Skills Suite/site"
npm install
npm run dev
```

---

## 🔌 Model Context Protocol (MCP) Integration

NexusFlow components include native MCP servers that can be added to your Claude Desktop or Google Antigravity configurations:

### NexusFlow Core Server
```json
{
  "nexusflow": {
    "command": "node",
    "args": ["<PATH_TO_REPO>/NexusFlow Core App/mcp/server.js"]
  }
}
```

### YouTube Uploader Server
```json
{
  "youtube-uploader": {
    "command": "node",
    "args": ["<PATH_TO_REPO>/NexusFlow YouTube Uploader/mcp/server.js"]
  }
}
```

---

## 🔒 Security & Privacy

- Sensitive credentials, auth tokens, `.env` files, and local session cookies are explicitly excluded via `.gitignore`.
- Rendered video outputs (`*.mp4`, `*.webm`) and heavy build directories (`node_modules/`, `dist/`) are omitted to keep the repository lightweight and portable.
- Always use environment variables or local secure storage for production API keys.

---

## 📜 License
Private & Proprietary — All rights reserved by `@cosmichackerx`.
