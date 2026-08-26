<!--
Sync Impact Report:
- Version change: 0.0.0 -> 1.0.0
- Added sections: Core Principles, Technical Quality & Testing, Architecture & Storage Constraints, Governance.
- Active constitution ratified.
-->
# Drachma Constitution

## Core Principles

### I. Safety & Non-Destructive Actions (NON-NEGOTIABLE)
Always preserve changes, diffs, untracked files, backups, fixtures, and database templates that do not belong to the current task. Do not discard, overwrite, or include unrelated materials in commits without explicit authorization.

### II. Graph-Guided Navigation
Before exploring code or making changes, developers and agents MUST query the `code-review-graph` to map context, dependencies, flows, impact, and existing tests. Rely on file reading only to address graph gaps or to verify implementation details.

### III. Interface Integrity & Standards
Before altering any user interface, consult applicable guidelines for typography, colors, layout, accessibility, and responsiveness. Build upon established patterns (labels, visual hierarchy, style tokens) to preserve existing layouts and accessibility targets.

### IV. Living Code Over Scaffolds
Do not treat project mockups, plans, proposals, or the README.md as a live contract. Always verify real APIs, types, persistence mechanisms, and live behavior in the active codebase.

### V. Focussed and Small Changes
Break down tasks into small, incremental, and highly-focused changes. Verify impact on affected flows and maintain required unit/integration test coverage before declaring tasks complete.

## Technical Quality & Testing

### Minimum Validation Pipeline
No code changes shall be marked complete without executing and passing the minimum validation steps:
- TypeScript type checking: `npx tsc --noEmit`
- Automated unit/integration testing: `npm test -- --run`
- Production build: `npm run build`
- Git verification: `git diff --check`

### Change-Specific Validation
- **Financial & Recurrence changes**: Run domain-focused tests and verify projection scenarios.
- **Persistence & Storage changes**: Run snapshot tests (valid/invalid payload states) and compatibility checks.
- **UI & Accessibility changes**: Test across desktop/mobile viewports, clear focus indicators, dark/light modes, keyboard controls, and error states.

## Architecture & Storage Constraints

### Local Initialization
Always run the dev server on port `3000` bound to localhost:
```bash
npm run dev -- --host 127.0.0.1 --port 3000
```
Avoid terminating unrelated background services or port mappings.

### Financial Storage & Core Data
Consult `DADOS_E_PERSISTENCIA.md` and type definitions in `types.ts` before modifying currency calculations, imports, exports, backups, or storage schemas.

## Governance

Compliance is checked on every task execution. Any structural changes, major architecture refactors, or modifications to the developer conventions defined in `AGENTS.md` and `VALIDACAO_APP.md` MUST trigger an amendment to this Constitution.

**Version**: 1.0.0 | **Ratified**: 2026-08-26 | **Last Amended**: 2026-08-26
