# 🔭 Gemini Lens

### Bulk AI-Powered File Categorizer

**Drag. Drop. Categorize. Export.**  
Harness the power of Google Gemini to instantly analyze and organize your images, videos, audio, and documents — all in your browser.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Google Gemini](https://img.shields.io/badge/Gemini-3.1_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Analysis** | Powered by Gemini 3.1 Flash — each file gets a category, description, confidence score, and relevant tags |
| 📂 **Multi-File Support** | Upload images, videos, audio files, and PDFs/documents in one go |
| ⚡ **Batch Processing** | Concurrent processing of 3 files at a time for maximum throughput |
| 🏷️ **Custom Taxonomy** | Define your own category list (e.g. `Receipts`, `Invoices`, `Vacation`) and Gemini will sort everything into them |
| 🔍 **Smart Filtering** | Filter results by category, file type, or free-text search across filenames, descriptions, and tags |
| 📊 **Stats Dashboard** | Live pie chart and bar chart showing category distribution as files are processed |
| 💾 **Export Results** | Download a clean JSON data export or a self-contained HTML report with charts and a searchable table |
| 📱 **PWA** | Installable as a Progressive Web App for an app-like experience |

---

## 🖥️ Tech Stack

**Frontend**
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 6](https://vitejs.dev/) (dev server & bundler)
- [Recharts](https://recharts.org/) (pie + bar charts)
- [Lucide React](https://lucide.dev/) (icons)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (service worker & manifest)

**Backend**
- [Express 5](https://expressjs.com/) (API server)
- [Google GenAI SDK (`@google/genai`)](https://ai.google.dev/gemini-api/docs) (Gemini integration)
- [tsx](https://github.com/privatenumber/tsx) (runs TypeScript directly in development)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- A **[Google Gemini API key](https://aistudio.google.com/app/apikey)**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/harryneopotter/ImageOrganizer.git
cd ImageOrganizer

# 2. Install dependencies
npm install

# 3. Set your Gemini API key
export GEMINI_API_KEY="your_api_key_here"

# 4. Start the development server
npm run dev
```

Open **http://localhost:3000** in your browser. 🎉

### Production Build

```bash
npm run build      # Compile frontend with Vite
npm start          # Serve the built app via Express
```

---

## 🧭 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                        │
│                                                             │
│   1. User uploads files   →   FileReader → base64          │
│   2. UI queues files as "pending"                          │
│   3. Batch processor picks up 3 at a time                  │
│   4. POST /api/analyze  ──────────────────────────────┐    │
│                                                        ↓    │
│                              ┌──────────────────────────┐  │
│                              │   Express API Server     │  │
│                              │                          │  │
│                              │  Gemini 3.1 Flash        │  │
│                              │  ├─ category             │  │
│                              │  ├─ description          │  │
│                              │  ├─ tags[]               │  │
│                              │  └─ confidence (0–1)     │  │
│                              └──────────────────────────┘  │
│                                                        │    │
│   5. Result updates card in real-time  ◄───────────────┘    │
│   6. Stats Dashboard updates live charts                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
ImageOrganizer/
├── server.ts                 # Express server + Gemini API proxy
├── App.tsx                   # Main application shell & state
├── index.tsx                 # React entry point
├── index.html                # HTML template
├── types.ts                  # Shared TypeScript interfaces
├── vite.config.ts            # Vite + PWA configuration
├── components/
│   ├── ImageCard.tsx         # Per-file result card (image/video/audio/doc)
│   └── StatsDashboard.tsx    # Live pie & bar charts
└── services/
    └── geminiService.ts      # fetch wrapper for /api/analyze
```

---

## 🎛️ Usage Guide

### 1 · Upload Files

Click **"Select Files"** or drag-and-drop. Supported types:

- 🖼️ **Images** — JPEG, PNG, GIF, WebP, …
- 🎵 **Audio** — MP3, WAV, OGG, …
- 🎬 **Video** — MP4, WebM, MOV, …
- 📄 **Documents** — PDF, plain text, …

### 2 · (Optional) Add Custom Categories

Type a category name in the **Settings** panel and press **Add**. Gemini will restrict its output to only those labels.

```
e.g.  Receipts  |  Invoices  |  Vacation  |  Work  |  Pets
```

### 3 · Start Processing

Hit **▶ Start** to begin. A spinning indicator appears on each card while it is being analysed. You can pause and resume at any time.

### 4 · Explore Results

Use the **search bar**, **Category** dropdown, and **File Type** dropdown to narrow down the results grid. The Stats Dashboard updates automatically.

### 5 · Export

| Button | Output |
|---|---|
| **Export JSON** | `gemini-lens-results.json` — raw structured data |
| **Export Report** | `gemini-lens-report.html` — standalone HTML with charts & searchable table |

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Your Google AI Studio API key |
| `NODE_ENV` | ❌ | Set to `production` to serve static build instead of Vite dev server |

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (Express + Vite HMR) on port 3000 |
| `npm run build` | Build the frontend with Vite into `dist/` |
| `npm start` | Serve the production build on port 3000 |
| `npm run preview` | Preview the Vite production build locally |

---

## 🗺️ Roadmap

See [`CLI_PLAN.md`](./CLI_PLAN.md) for the planned command-line interface that will allow you to run bulk analysis directly from your terminal:

```bash
# Planned
gemini-lens analyze ./my-folder --type image --categories "Vacation,Work,Pets" --output results.json
```

Planned CLI features include directory scanning, file-type filtering, configurable batch sizes, CSV/JSON output, and a terminal progress bar.

---

<div align="center">
Built with ❤️ and powered by <a href="https://ai.google.dev/">Google Gemini</a>
</div>
