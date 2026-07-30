# 🌼 Jonquil — Personal AI Agent Ecosystem
<div align="center">

  <!-- GitHub Banner Image -->
  <img src="https://jonquil.ardkinci.com/jonquil-readme-banner.png" alt="Jonquil Banner" width="100%">
  
  <br/><br/>

  <p align="center">
    <a href="https://github.com/jonquil-ai/jonquil/releases"><img src="https://img.shields.io/github/v/release/jonquil-ai/jonquil?style=for-the-badge&color=FFD700&labelColor=09090b" alt="Release"></a>
    <a href="#"><img src="https://img.shields.io/badge/Platforms-WhatsApp%20%7C%20Telegram-FFD700?style=for-the-badge&labelColor=09090b" alt="Platforms"></a>
    <a href="https://github.com/jonquil-ai/jonquil/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-FFD700?style=for-the-badge&labelColor=09090b" alt="License"></a>
  </p>

  <p align="center">
    <b>The AI that <i>actually</i> lives in your chats.</b>
  </p>
  <p align="center">
    Your cross-platform, highly intelligent, and personal AI assistant.
  </p>

  <p align="center">
    <a href="https://jonquil.ardkinci.com/">Website</a> · 
    <a href="https://jonquil.ardkinci.com/docs">Docs</a> · 
    <a href="#-quick-start">Getting Started</a> · 
    <a href="#-core-capabilities">Capabilities</a> · 
    <a href="#-architecture">Architecture</a> · 
    <a href="#-roadmap">Roadmap</a>
  </p>
</div>

---

**Jonquil** is a *personal AI agent* that learns and grows with you, running on your own infrastructure — developed in the open. It answers you on the platforms you already use (like WhatsApp, Telegram etc.), sees visual media, creates stickers, and knows when to stay silent.

If you want a personal assistant that feels local, fast, human-like, and always-on, this is it.

---

## ⚡ Quick Start

Jonquil runs locally on your own machine or server.

### 1. Prerequisites
Ensure you have **Node.js 20.x+** installed.

### 2. Installation
Clone the repository and install the workspace dependencies:

```bash
# Clone the core repository
git clone https://github.com/jonquil-ai/jonquil.git
cd jonquil

# Install monorepo dependencies (Powered by NPM Workspaces)
npm install
```

### 3. Environment Configuration
Copy the `.env.example` template and configure your provider keys:

```bash
cp .env.example .env
```
Edit your `.env` file to set your AI Provider (`gemini` or `mistral`) and platform tokens:
```env
ACTIVE_PROVIDER=gemini
GEMINI_KEY=your_gemini_api_key
TG_BOT_TOKEN=your_telegram_bot_token
```

### 4. Running Jonquil
Jonquil architecture separates the **Brain (Core)** from the **Senses (Gateways)**. Start them in separate terminals:

```bash
# Terminal 1: Start the AI Orchestrator (The Brain)
npm run dev:core

# Terminal 2: Start your preferred Gateway (The Senses)
npm run dev:wa    # Start WhatsApp Gateway
# OR
npm run dev:tg    # Start Telegram Gateway
# OR
npm run dev:sim   # Start Local CLI Simulator for testing
```

---

## 🧠 Core Capabilities

- 👻 **Ghost Mode (Smart Lurker):** Evaluates group chat dynamics in real-time. If two humans are conversing, Jonquil outputs `<SILENCE>` and stays out of the noise. She only speaks when mentioned, replied to, or when she can provide genuine value.
- 👁️ **Visual Memory & Vision:** Processes images and videos seamlessly. Rather than bloating context memory with raw media, she summarizes visual inputs in her private `<thought>` scratchpad for long-term recall.
- 🎨 **Native Physical Actions:** Tell Jonquil *"make this a sticker"*, and she will download the quoted/attached image, process it via `sharp`, and send back an actual sticker on WhatsApp.
- 💬 **Async Message Debouncing:** Humans text rapidly in short bursts. Jonquil's built-in `MessageBatcher` waits for brief pauses, combines fragmented messages into a single coherent prompt, and responds naturally.
- 🎙️ **Voice Notes (TTS):** Converts text replies into natural voice recordings using built-in Text-To-Speech tools.
- 🔄 **Provider Agnostic:** Switch between Google Gemini, Mistral AI, or custom LLM adapters instantly via `.env`.

---

## 🏗️ Architecture

Jonquil is built as a clean, modular Monorepo leveraging **NPM Workspaces**:

```
jonquil/
├── core/                  # AI Core, Prompt Management & Tool Engine
│   └── src/
│       ├── ai/            # Context Builder, Task Locks, Token Memory & Adapters
│       └── tools/         # Currency, Weather, Translate, Sticker, TTS, Wiki
├── gateways/              # Platform Connectors (Data Converters to Universal DTOs)
│   ├── whatsapp/          # Baileys WebSockets implementation
│   ├── telegram/          # Telegraf Bot API implementation
│   └── simulator/         # Local CLI Playback & Export Engine for testing
└── packages/              # Shared Utilities
    ├── shared/            # UniversalMessage DTOs & Core Client
    └── logger/            # Deep Debug Logger with Inspect support
```

---

## 🗺️ Roadmap

- [x] **Phase 1: Agent Core & Multi-Gateway** (WhatsApp, Telegram, Simulator, Vision, Ghost Mode, Tool Calling)
- [ ] **Phase 2: Personal Cloud & Local RAG** (Local Account Management, PDF/Doc Vector Indexing, Web Dashboard)
- [ ] **Phase 3: Federated Ecosystem** (Jonquil ID, Multi-Tenant Cloud Sync, Cross-Instance Roaming Memory)

---

## 🤝 Contributing

Contributions are warmly welcomed! Whether it's adding a new platform gateway, introducing new LLM providers, or building custom tools:

1. Fork the Repository
2. Create your Feature Branch (`git checkout -b feat/AmazingSkill`)
3. Commit your Changes (`git commit -m 'feat: add some AmazingSkill'`)
4. Push to the Branch (`git push origin feat/AmazingSkill`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
<div align="center">
  <sub>Built with ❤️ by <a href="https://ardkinci.com/?utm_source=github&utm_medium=readme&utm_campaign=built_by&utm_content=jonquil-ai/jonquil">ardkinci</a></sub>
</div>