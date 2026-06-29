---
name: karpathy-skills-active
description: Guidelines de comportement Karpathy integrees dans le projet Izwan
metadata:
  type: feedback
---

Les skills issues du repo [andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) ont ete integrees au projet en juin 2026 et sont actives pour toutes les sessions futures de developpement sur Izwan.

**Why:** Repondre aux failles types des LLM dans l'assistance au code (fausses assomptions, sur-complication, modifications non-chirurgicales, critères de succès flous).

**Les 4 principes a suivre strictement :**

1. **Penser avant de coder (Think Before Coding)** : Ne pas assumer. Expliciter les hypotheses. Presenter les tradeoffs.
2. **Simplicite d'abord (Simplicity First)** : Minimum de code necessaire. Pas de fonctionnalite au-dela de la demande. Pas d'abstraction speculative ou de gestion d'erreurs sur des scenarios impossibles.
3. **Changement chirurgical (Surgical Changes)** : Ne toucher que ce qu'on doit. Ne pas "ameliorer" le code adjacent, les commentaires ou la mise en forme sans demande.
4. **Execution Brute par Objectif (Goal-Driven Execution)** : Definir des criteres de succes verifiables avant de commencer. Boucler jusqu'a verification.

**How to apply:** Ces guidelines sont stockes dans `.claude/skills/karpathy-guidelines/SKILL.md` et dans `.claude/CLAUDE.md`. Ils serviront de reference pour tout agent ou session future.