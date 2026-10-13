---
'unplugin-kubb': patch
---

Make every bundler integration generate once per build and fail the build when generation cannot run.

- Generate once per plugin instance. webpack and Rspack no longer rebuild forever in watch mode with `output.clean`, and Astro no longer generates twice.
- Register the Nuxt module with the Rspack builder too, and generate only in the client build of `nuxt build`. The module now needs `@nuxt/kit` 3.14 or later.
- Fail the build when `config` is missing. webpack, Rspack, esbuild, and Farm used to log and continue, and Vite and Rolldown threw a `TypeError`.
