---
'@kubb/cli': minor
'@kubb/core': minor
---

Install, update, and list reviewed plugins, adapters, and parsers from the Kubb registry at `https://kubb.dev/registry`. Registry support landed across 5.8.1 to 5.8.4 and is stable from this release.

- `kubb add <id>` installs an extension at the version the registry pins, after it checks that the extension supports your Kubb version. It also adds a plugin to `kubb.config.ts`.
- `kubb update` moves installed extensions to the registry version, and `kubb update --check` only lists the updates. `kubb list` shows each installed extension and whether an update exists.
- A package joins the registry with a `kubb-extension.json` manifest. Each entry pins one npm version or one GitHub release, and Studio runs installed third-party plugins that ship a manifest.
- `defineExtension` defines a plugin, an adapter, or a parser. `definePlugin`, `defineParser`, and `createAdapter` still work but are deprecated.
- `KUBB_REGISTRY` points the CLI at another registry.

```shell
kubb add plugin-zod
kubb update --check
kubb list
```
