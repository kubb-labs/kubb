---
"@kubb/studio": patch
---

Fix a snapshot package's `package.json` pointing `main`/`module`/`exports['.']` at
`dist/index.*` even when the generation had no top-level barrel, and add a wildcard
`exports['./*']` so individual generated files stay importable by path.
