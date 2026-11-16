---
'unplugin-kubb': minor
---

Add the `include` option to choose which imported spec files load as a module. It defaults to `*.openapi.yaml` and `*.openapi.yml`. Set `include: /\.openapi\.(ya?ml|json)$/` to also load `*.openapi.json` specs. Those modules load as JavaScript in every bundler, so esbuild, Rolldown and Vite no longer parse them as JSON.
