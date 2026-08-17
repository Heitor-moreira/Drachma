---
name: drachma-validate-ui
description: Use when changing or diagnosing Drachma screens, components, modals, forms, navigation, typography, colors, responsive behavior, or browser interactions
---

# Validate Drachma UI

## Before editing

- Read `FONTES_TIPOGRAFICAS.md` for text UI and `CORES_APP.md` for visual tokens.
- Inspect the current component and preserve labels, order, placement, requested measurements, and semantic light/dark tokens.
- Use the Code Review Graph first for impact and related consumers when the change touches existing behavior.

## Validation workflow

1. Verify the running Drachma instance on TCP port 3000 before starting or restarting it. If it is already running, leave it untouched.
2. Use the current project command when startup is needed: `npm run dev -- --host 127.0.0.1 --port 3000`.
3. Test the real browser flow at the relevant viewport, including mobile dimensions when the change affects layout or inputs.
4. Inspect console errors, computed styles, and bounding rectangles when a visual change appears unchanged; prefer structural layout fixes over fixed-height or negative-margin compensation.
5. For editable mobile fields, keep at least 16px text to avoid automatic Safari/iOS zoom; never use `user-scalable=no`.
6. Check modal focus, actions, alignment, weight, color, wrapping, dismissal, and empty states. An empty post-selection query must hide tag suggestions.
7. Run `npx tsc --noEmit`, `npm run build`, and `git diff --check` after implementation.

## Finance-specific visual checks

When a transaction or balance UI changes, verify amount sign/color/icon, balance row, and balance arithmetic across all related screens—not only the edited component.
