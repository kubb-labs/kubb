---
'@kubb/cli': minor
---

`kubb init` now scaffolds a working v5 project.

The generated `kubb.config.ts` uses the v5 shape (`defineConfig` from `kubb/config` with a string `input` and no `root`), and it lists `@kubb/plugin-axios` and `@kubb/plugin-fetch` instead of the removed `@kubb/plugin-client`. `kubb` installs at the exact version of the CLI running the wizard, so the packages you get always match the wizard you ran. Plugins keep following that release channel's dist-tag, since they ship from their own repo.
