# ⚡ Speed Chat Suggestion System

A cross-platform AI-powered desktop application that suggests **context-aware, tone-matched replies** for real-time messaging apps like WhatsApp or Messenger. Built using **Electron**, **React**, and **Gemini API**, it enhances your chat experience by reducing typing fatigue and speeding up communication.

> 🧠 Your chats, your tone — made faster with AI.


## Demo
[![Watch the demo](https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg)](https://youtu.be/74U89rqjy7c?si=dis1J8-oHxZYb9R4)

---

## ✨ Features

- 💡 **AI Reply Suggestions** – Generates smart replies based on the chat context.
- 🧬 **Tone Matching** – Adapts to the user’s unique writing style using LLM prompts.
- ⚡ **One-Click Replying** – Edit and send suggestions instantly.
- 💻 **Cross-Platform** – Available on **macOS**, **Windows**, and **Linux**.
- 🔐 **Privacy-Aware** – Local processing options and secured chat handling.
- 🎨 **Modern UI** – Built with TailwindCSS and Lucide icons for a sleek desktop experience.

---

## 🛠️ Tech Stack

- **Frontend:** React + TailwindCSS
- **Backend:** Node.js + TypeScript
- **Electron Integration:** Electron + Electron Builder
- **AI API:** Gemini (configurable for OpenAI, local models, etc.)
- **Build Tooling:** Vite + TypeScript + ESLint

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v18+`
- npm or yarn
- Gemini API Key (or OpenAI API Key if adapted)

---

### 🧪 Development

```bash
# Clone the repo
git clone https://github.com/your-username/speed-chat-suggester.git
cd speed-chat-suggester

# Install dependencies
npm install

# Start development (React + Electron)
npm run dev

```

📦 Build for Production

# Build for macOS (arm64)
npm run dist:mac

# Build for Windows
npm run dist:win

# Build for Linux
npm run dist:linux

You can also run npm run build to generate a production build of the frontend separately.


📁 Project Structure

├── src

│   ├── electron         # Electron main process code (tsconfig.json inside)

│   ├── renderer         # React frontend with Vite

│   └── shared           # Shared interfaces/configs (optional)

├── dist-electron        # Compiled Electron output

├── public               # Static assets

└── package.json


🔑 Environment Variables
Create a .env file in the root and add:

VITE_GEMINI_API_KEY=your_api_key_here
Note: Use .env.production for production builds.

📦 Packaging Info
This app uses electron-builder to generate installable binaries. You can find builds in the dist/ folder after running the relevant dist:* commands.

🤝 Contributing
Contributions are welcome! Feel free to fork the repo and open a pull request.

🔗 Let's connect!
If you like the project or want to collaborate:

💼 [LinkedIn](https://www.linkedin.com/in/faraz-mohammed-162289227)

💬 Drop a ⭐ if this repo helped you!
