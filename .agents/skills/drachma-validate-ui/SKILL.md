---
name: drachma-validate-ui
description: Use when changing or diagnosing Drachma screens, components, modals, forms, navigation, typography, colors, responsive behavior, or browser interactions
---

# Validate Drachma UI

`AGENTS.md` é a fonte de verdade para as instruções específicas do projeto,
incluindo tipografia, cores, cabeçalhos, grafo, servidor local e regras de
OpenCodeReview. Esta skill define somente o fluxo operacional para investigar,
alterar e validar interfaces.

## Before editing

- Read `AGENTS.md` and follow its project-specific UI rules before editing.
- Inspect the current component and identify the relevant layout, responsive and interaction states.
- Use the Code Review Graph according to the workflow defined in `AGENTS.md`.

## Validation workflow

1. Verify or start the local Drachma instance according to `AGENTS.md`.
2. Test the real browser flow at the relevant viewport, including mobile dimensions when the change affects layout or inputs.
3. Inspect console errors, computed styles and bounding rectangles when a visual change appears unchanged; prefer structural layout fixes over compensating offsets.
4. For editable mobile fields, keep at least 16px text to avoid automatic Safari/iOS zoom; never use `user-scalable=no`.
5. Check modal focus, actions, alignment, wrapping, dismissal and empty states. An empty post-selection query must hide tag suggestions.
6. Run `npx tsc --noEmit`, `npm run build` and `git diff --check` after implementation.

## Finance-specific visual checks

When a transaction or balance UI changes, verify amount sign/color/icon, balance row, and balance arithmetic across all related screens—not only the edited component.
