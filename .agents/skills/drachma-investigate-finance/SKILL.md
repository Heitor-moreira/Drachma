---
name: drachma-investigate-finance
description: Use when investigating Drachma transaction, balance, recurrence, installment, totals, import, or financial-classification behavior
---

# Investigate Drachma Finance Behavior

## Core rule

Treat the current source contract as authoritative. Do not apply historical guidance without rechecking the live types, projection, persistence, and UI paths.

## Workflow

1. Start with the Code Review Graph MCP tools when available; use minimal context first.
2. Inspect the current contracts in `types.ts`, `finance.ts`, `App.tsx`, and the relevant component before editing.
3. Trace the complete path: form or importer → state/persistence → projection/calculation → rendered view.
4. For recurrence, verify `recurrenceFrequency`, `recurrenceCount`, `recurrenceExcludedDates`, `getRecurrenceDate`, and legacy `isFixed` fallback. Remember that `recurrenceCount=1` means the original plus one occurrence.
5. For installments, audit `isInstallment`, `installmentInfo`, batch fields, and expense-manager paths separately; do not assume they share recurrence behavior.
6. For financial classification, preserve the selected `EntryType` (`INCOME`, `EXPENSE`, `SAVINGS`, `CARD`) end to end. Check amount sign, color, icon, balance row, and arithmetic across related screens.
7. For totals and monthly views, reuse `projectTransactions` and `getTransactionEntryType` and verify navigation/effects that may reset the active tab.
8. Validate with `npx tsc --noEmit`, `npm run build`, `git diff --check`, and focused browser interaction when UI behavior changes.

## Safety constraints

- Preserve unrelated diffs, backups, fixtures, and untracked schema/data files.
- Never treat a backup or proposed schema as the live contract without inspecting import/export and localStorage behavior.
- For recurring deletion, distinguish one occurrence, future occurrences, and the entire series; preserve exact modal copy and use one explicit modal instead of chained confirms.
