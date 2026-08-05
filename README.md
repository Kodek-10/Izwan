# Izwan — Multi-Platform AI Snippet Manager

Izwan is a complete ecosystem to capture, organize and reuse your code snippets intelligently, powered by AI. Stop re-searching solutions you have already implemented — your code, your golden patterns, always at hand.

## 🚀 Project Components

This is a **monorepo** containing:

| Component | Description | Tech |
|---|---|---|
| [`backend/`](./backend) | High-performance REST API with semantic search, AI enrichment and admin/security features | **FastAPI**, SQLAlchemy, FastEmbed, Postgres/SQLite |
| [`frontend/`](./frontend) | Modern, responsive web app and admin dashboard | **React 19** + TanStack Start (SSR), Tailwind CSS, Shadcn/UI |
| [`vscode-extension/`](./vscode-extension) | VS Code extension to access & insert snippets directly from your editor | **TypeScript**, VS Code Extension API |
| [`desktop/`](./desktop) | Native desktop shell (Electron) that loads the hosted app | **Electron**, electron-builder |

## ✨ Key Features

- 🧠 **Semantic Search** — find a snippet by *intent*, not just by keywords (vector search with FastEmbed).
- 🔌 **Multi-surface** — web app, VS Code extension (browser OAuth login) and desktop app.
- 📁 **Smart organization** — collections, tags and favorites.
- 🤖 **AI enrichment & assistance** — automatic tags/descriptions, code explanation, via **Groq** (cloud) or **Ollama** (100% local / air-gapped).
- 🛡️ **Enterprise-grade security** — JWT + httpOnly cookies, Google & GitHub OAuth, role-based access (USER / ADMIN), admin dashboard, audit log, rate limiting, token revocation.
- 📤 **Flexible export** — snippets as **Markdown** or **PDF** (Jinja2 + xhtml2pdf).
- 🌐 **i18n** — French and English interfaces, dark mode included.

## 🗺️ Vision & Roadmap

Izwan is evolving toward a real **Digital Brain for Developers** in the vibe-coding era.

- See the [detailed roadmap](./ajout_supplementaires.md) for the phased evolution (steps 1 to 7, kept at the project root).
- Read our [strategic overview](./docs/presentation/vision.md).
- Product description in [`docs/presentation/description.md`](./docs/presentation/description.md).

## 🏗️ Architecture

The project runs in **V2 (cloud-hosted)** mode:

| Layer | Hosting | URL |
|---|---|---|
| Backend API | Render | `https://izwan-backend.onrender.com` |
| Frontend / Landing | Cloudflare Pages | `https://izwan.pages.dev` |
| Database | Supabase (Postgres) | via pooler |

- The **desktop app** and **VS Code extension** simply connect to this hosted backend.
- For fully **offline / air-gapped** use, the backend falls back to **SQLite** + **Ollama** (see `docs/` and the deployment notes).

## 🛠️ Quick Start (local development)

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then fill in the values
alembic upgrade head              # apply DB migrations
uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`, interactive docs at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
bun install                       # or: npm install
bun run dev                       # or: npm run dev
```

### 3. VS Code extension

1. Open the `vscode-extension/` folder in VS Code.
2. Run `npm install`.
3. Press `F5` to launch an Extension Development Host.

### 4. Desktop app

```bash
cd desktop
npm install
npm run dev
```

## 📖 Documentation

- The full project documentation (presentation, specifications, reports) is organized under [`docs/`](./docs/README.md).
- Each component has its own README (see the links above).

## 📄 License

This project is licensed under the **MIT** license. See the [`LICENSE`](./LICENSE) file for details.

---
Built by the Izwan community.