---
"@kubb/agent": minor
---

Align `@kubb/agent` with the Kubb v5 adapter/middleware model and Studio protocol.

### Dynamic plugin and middleware resolution

Plugins and middlewares are now resolved at runtime via dynamic `import()`. The agent no longer bundles any `@kubb/plugin-*` packages as direct dependencies. Any package installed in the Docker image is loadable — both `@kubb/*` scoped and third-party packages.

Factory resolution tries three strategies in order: camelCase named export (e.g. `pluginReactQuery`), `default` export, then the first exported function.

When a package cannot be imported, the agent throws a clear error:

```
Plugin "@kubb/plugin-ts" could not be loaded. Make sure it is installed: `npm install @kubb/plugin-ts`
```

### Middleware support in Studio config

The `JSONKubbConfig` type now accepts a `middleware` array alongside `plugins`. Studio can send middleware entries by package name; the agent loads and instantiates each one before passing them to `createKubb`.

```ts
// Studio payload
{
  plugins: [{ name: '@kubb/plugin-ts', options: { output: { path: './types' } } }],
  middleware: [{ name: '@kubb/middleware-barrel', options: {} }]
}
```

When `middleware` is absent from the Studio payload, the agent falls back to the `middleware` array from the disk `kubb.config.ts`.

### Adapter forwarding

`JSONKubbConfig` now accepts an optional `adapter` field. The agent forwards it unchanged to `createKubb` — the adapter factory validates its own options.

```ts
// Studio payload
{
  adapter: { serverIndex: 1, contentType: 'application/json' }
}
```

### KUBB_PACKAGES Docker build ARG

The Dockerfile exposes a `KUBB_PACKAGES` build ARG that controls which packages are pre-installed in the image. Override it at build time to add plugins, middlewares, or third-party packages:

```sh
docker build \
  --build-arg KUBB_PACKAGES="kubb @kubb/core @kubb/plugin-ts @kubb/middleware-barrel my-custom-plugin" \
  .
```

Because Stage 2 is distroless (no shell or package manager), only packages baked in at build time are ever resolvable at runtime.

### Peer dependency check at startup

The agent calls `checkPeerDependencies()` on startup and logs a clear warning when `@kubb/renderer-jsx` is missing — all v5 plugins require it.

```
[warn] Missing peer dependency @kubb/renderer-jsx. Install it alongside kubb plugins.
```
