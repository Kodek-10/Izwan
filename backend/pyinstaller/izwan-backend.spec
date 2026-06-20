# -*- mode: python ; coding: utf-8 -*-

from pathlib import Path


backend_root = Path(__file__).resolve().parents[1]


a = Analysis(
    [str(backend_root / "desktop_entry.py")],
    pathex=[str(backend_root)],
    binaries=[],
    datas=[],
    hiddenimports=[
        "app.main",
        "app.api.auth",
        "app.api.snippets",
        "app.api.collections",
        "app.api.search",
        "app.api.export",
        "app.api.ai",
        "fastembed",
        "langchain_ollama",
        "langchain_groq",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="izwan-backend",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
