---
"@kubb/agent": minor
---

Resolve plugins and middlewares at runtime via dynamic `import()`. The agent no longer bundles any `@kubb/plugin-*` packages as dependencies — any package installed in the Docker image is loadable.

`JSONKubbConfig` accepts `middleware` and `adapter` fields alongside `plugins`. The `KUBB_PACKAGES` Docker build ARG controls which packages are pre-installed.

A peer dependency check runs at startup and warns when `@kubb/renderer-jsx` is missing.
