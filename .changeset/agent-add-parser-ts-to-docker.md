---
'@kubb/agent': patch
---

Add `@kubb/parser-ts` to the default `KUBB_PACKAGES` build ARG in the agent Dockerfile.

`kubb.config.ts` files that import `@kubb/parser-ts` (e.g. to use `parserTs`) would fail at runtime inside the Docker container with `Cannot find package '@kubb/parser-ts'` because the package was not explicitly listed in the installer stage. It is now included alongside the other Kubb packages.
