# Izwan Desktop

Electron shell for shipping Izwan as a native desktop app.

## What It Provides

- Loads the React frontend in a native desktop window.
- Starts the local FastAPI backend automatically.
- Uses a bundled `izwan-backend` binary when present, with a Python/uvicorn fallback for development.
- Stores the SQLite database in the app user data directory.
- Adds a system tray menu.
- Registers `Alt+Space` to show Izwan and focus the search field.
- Can start a bundled or system Ollama process with `IZWAN_DESKTOP_MANAGE_OLLAMA=1`.
- Defines installer targets for Windows (`nsis`), macOS (`dmg`) and Linux (`AppImage`, `deb`).

## Development

```bash
npm install
npm run dev
```

The development shell starts:

- backend: `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`
- frontend: `npm run dev -- --host 127.0.0.1 --port 4173`

## Packaging

Build the frontend first:

```bash
npm run build:frontend
```

Build a backend executable with PyInstaller:

```bash
pip install -r ../backend/requirements-desktop.txt
npm run build:backend:win
```

Then generate an installer:

```bash
npm run dist:win
npm run dist:mac
npm run dist:linux
```

To bundle Ollama, place the platform executable in `desktop/ollama/` before packaging.
