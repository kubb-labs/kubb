---
'@kubb/agent': patch
---

Add `@kubb/parser-ts` and `@kubb/middleware-barrel` as runtime `dependencies` of the agent, and include `@kubb/parser-ts` in the default `KUBB_PACKAGES` Docker build ARG.

`kubb.config.ts` files that import `@kubb/parser-ts` (e.g. to use `parserTs`) would fail at runtime inside the Docker container with `Cannot find package '@kubb/parser-ts'` because the package was not installed in the image. Both packages are now declared as proper runtime dependencies so they are available in all deployment scenarios (Docker and non-Docker).
