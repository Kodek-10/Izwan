import { useEffect, useState } from "react";

// Préférences d'éditeur réglées dans /settings et réellement appliquées par CodeEditor.
// Les clés localStorage sont celles écrites par la page Paramètres.
export const EDITOR_PREFS_EVENT = "izwan:editor-prefs";

const KEYS = {
  fontSize: "izwan_fontSize",
  tabSize: "izwan_tabSize",
  ligatures: "izwan_ligatures",
} as const;

export type EditorPreferences = {
  fontSize: number;
  tabSize: number;
  ligatures: boolean;
};

export const EDITOR_PREFS_DEFAULTS: EditorPreferences = {
  fontSize: 14,
  tabSize: 4,
  ligatures: true,
};

export function readEditorPreferences(): EditorPreferences {
  if (typeof window === "undefined") return EDITOR_PREFS_DEFAULTS;
  try {
    const fontSize = parseInt(localStorage.getItem(KEYS.fontSize) || "", 10);
    const tabSize = parseInt(localStorage.getItem(KEYS.tabSize) || "", 10);
    return {
      fontSize: Number.isFinite(fontSize) ? fontSize : EDITOR_PREFS_DEFAULTS.fontSize,
      tabSize: Number.isFinite(tabSize) ? tabSize : EDITOR_PREFS_DEFAULTS.tabSize,
      ligatures: localStorage.getItem(KEYS.ligatures) !== "false",
    };
  } catch {
    return EDITOR_PREFS_DEFAULTS;
  }
}

/** Lit les préférences côté client et se met à jour quand elles changent. */
export function useEditorPreferences(): EditorPreferences {
  // Valeurs par défaut au premier rendu : localStorage n'existe pas côté serveur (SSR).
  const [prefs, setPrefs] = useState<EditorPreferences>(EDITOR_PREFS_DEFAULTS);

  useEffect(() => {
    const load = () => setPrefs(readEditorPreferences());
    load();
    window.addEventListener(EDITOR_PREFS_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(EDITOR_PREFS_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  return prefs;
}
