---
"@kubb/agent": minor
---

Decouple `@kubb/agent` from static plugin knowledge.

Plugins are now resolved at runtime via dynamic `import()` instead of being hard-coded as dependencies. This means:

- `@kubb/agent` no longer bundles or lists any `@kubb/plugin-*` packages as dependencies.
- Any Kubb plugin (or third-party plugin) is supported — install whichever plugins you need alongside the agent.
- Plugin factory resolution tries three strategies in order: camelCase named export (`pluginReactQuery`), `default` export, or first exported function.

```ts
// Before: agent required @kubb/plugin-ts to be a bundled dependency
// After: install it separately — the agent loads it on demand
```

If a plugin cannot be resolved, a clear error is thrown:

> Plugin '@kubb/plugin-ts' could not be loaded. Make sure it is installed.
