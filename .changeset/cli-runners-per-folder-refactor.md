---
'@kubb/cli': patch
---

Refactor CLI runners into per-command folders (`runners/generate/`, `runners/validate/`, `runners/agent/`, `runners/init/`, `runners/mcp/`), each with a dedicated `run.ts` and `utils.ts`. Fixes `import.meta.resolve` build warning in CJS output and corrects a faulty path-traversal guard in `hasPackageJson` that caused CI test failures.
