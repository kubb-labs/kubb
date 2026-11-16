---
'unplugin-kubb': patch
---

An import of a config's `input` file now loads as a spec module whatever its name, so `import { Pet } from './my-api.openapi.json'` works when `input` is `./my-api.openapi.json`. Before, only `*.openapi.yaml` and `*.openapi.yml` imports loaded. Other specs still need one of those names.

Spec modules load as JavaScript in every bundler, so esbuild, Rolldown and Vite no longer parse a `.json` spec as JSON. If your app imports its `input` file as plain JSON data, that import now returns the generated module instead.
