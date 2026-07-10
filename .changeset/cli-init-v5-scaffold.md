---
"@kubb/cli": patch
---

`kubb init` now scaffolds a working v5 project. The generated `kubb.config.ts` uses the v5 shape (`defineConfig` from `kubb/config` with a string `input` and no `root`), and the installed packages are pinned to the dist-tag of the running CLI, so a beta CLI installs `kubb@beta` and beta plugins instead of the older stable majors.
