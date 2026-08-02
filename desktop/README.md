# Izwan Desktop

Coquille native (Electron) qui ouvre l'application web hébergée d'Izwan dans une
fenêtre bureau — modèle **V2** : le backend (Render) et le frontend (Cloudflare
Pages) tournent en ligne, le desktop se contente de les charger.

## Ce qu'elle apporte
- Fenêtre native chargeant `https://izwan.pages.dev`.
- Icône dans la barre système (tray) + raccourci global `Alt+Space` (recherche rapide).
- Instance unique (une 2ᵉ ouverture refocalise la fenêtre existante).
- Installeurs Windows (`.exe` NSIS) et Linux (`AppImage`, `.deb`).

L'URL chargée est configurable : `IZWAN_DESKTOP_URL=https://autre.exemple npm run dev`.

## Développement
```bash
npm install
npm run dev
```

## Build local
```bash
npm run dist:win     # sur Windows -> release/*.exe
npm run dist:linux   # sur Linux   -> release/*.AppImage, *.deb
```
> Le backend embarqué (PyInstaller) et le frontend local ont été **retirés** en V2 :
> tout est hébergé, la coquille ne fait que charger l'app en ligne.

## Publication des téléchargements
La CI GitHub Actions (`.github/workflows/desktop-release.yml`) build Windows +
Linux et publie les installeurs sur une **GitHub Release** dès qu'on pousse un tag :
```bash
# aligner la version dans package.json puis :
git tag v0.1.0
git push origin v0.1.0
```
Les artefacts apparaissent dans l'onglet Releases (release en brouillon à finaliser).
La landing pointera ensuite vers ces fichiers pour le téléchargement.
