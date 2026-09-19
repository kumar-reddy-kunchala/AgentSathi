# ServiceAgent - System & Software Requirements

This document outlines all system requirements, software prerequisites, environment variables, dependencies, and deployment instructions for **ServiceAgent (Sathi AI Autonomous Service Coordinator)**.

---

## 1. Runtime & System Prerequisites

| Requirement | Recommended Version | Description |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.x` or `>= 20.x` | JavaScript runtime environment |
| **Package Manager** | `npm` (>= 9.x) or `bun` / `pnpm` | Package dependency installer |
| **Operating System** | Linux, macOS, or Windows (WSL2 recommended) | Any POSIX-compliant OS |
| **Web Browser** | Chrome, Edge, Safari, or Firefox | Modern browser supporting Web Speech API for voice interactions |

---

## 2. Environment Variables (`.env`)

Create a `.env` file in the root directory based on `.env.example`:

```env
# Required for Sathi AI Voice/Chat Orchestration
GEMINI_API_KEY=your_gemini_api_key_here

# Application Hosting URL
APP_URL=http://localhost:3000

# Server Port (Auto-detected on Render / Cloud Run / Docker)
PORT=3000

# Node Environment
NODE_ENV=production

# Optional Integrations
GOOGLE_MAPS_API_KEY=
FIREBASE_PROJECT_ID=
PAYMENT_PROVIDER_KEY=
PAYMENT_PROVIDER_SECRET=
EMAIL_PROVIDER_KEY=
SMS_PROVIDER_KEY=
WHATSAPP_PROVIDER_KEY=
```

---

## 3. Key Dependencies & Libraries

### Core Frameworks
- **React**: `^19.0.1` (Frontend UI Engine)
- **Express**: `^4.21.2` (Backend HTTP Server & API Routes)
- **Vite**: `^8.3.0` (Fast Bundler & Development Server)
- **TypeScript**: `^7.0.2` (Type Safety Engine)

### AI & Speech SDKs
- **@google/genai**: `^2.4.0` (Google Gemini AI Model Integration)
- **Web Speech API**: Browser-native SpeechRecognition & SpeechSynthesis for real-time voice converse

### UI & Styling
- **Tailwind CSS**: `^4.3.3` (Utility-first styling framework)
- **Lucide React**: `^0.546.0` (Icon set)
- **Motion**: `^12.23.24` (Animations & transitions)

---

## 4. Installation & Running Locally

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Environment Variables
Copy `.env.example` to `.env` and insert your Gemini API Key:
```bash
cp .env.example .env
```

### Step 3: Run Development Server
```bash
npm run dev
```
Access the app at `http://localhost:3000`.

---

## 5. Production Build & Deployment Commands

### Build Command
```bash
npm run build
```
This builds:
1. React static assets into `dist/` via Vite.
2. Express server into a bundled file at `dist/server.cjs` via `esbuild`.

### Start Command
```bash
npm start
```
Runs `node dist/server.cjs` on port `3000` (or `process.env.PORT`).

---

## 6. Hosting Provider Quick Reference (Render, Vercel, Docker)

### Render (Web Service)
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Environment Variables:** `NODE_ENV=production`, `GEMINI_API_KEY=your_key`

### Docker / Cloud Run
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```
