---
'@kubb/core': patch
'@kubb/kit': patch
'@kubb/cli': patch
'@kubb/adapter-oas': patch
'@kubb/parser-ts': patch
'@kubb/parser-md': patch
'@kubb/plugin-barrel': patch
---

Add `kubb extension build`. It writes `dist/kubb.json`, one manifest per package with each plugin, adapter, and parser it exports: the `meta`, and the options as JSON Schema with their JSDoc text, `@default`, `@example`, `@see`, and TypeScript type. Studio, the kubb.dev registry, and the options reference pages read it. Run it after the package build, and add `--check` in CI to fail when the manifest is out of date. The command needs `typescript`, now an optional peer of `@kubb/cli`.

```json
{
  "scripts": {
    "build": "tsdown && kubb extension build"
  },
  "kubb": "./dist/kubb.json",
  "exports": {
    "./kubb.json": "./dist/kubb.json"
  }
}
```

`@kubb/core` exports the manifest types, `kubbManifestJsonSchema`, `readExtensionManifest`, and `getExtensionManifest`, which returns the manifest a package ships, or builds one from `meta` and the options schema. A plugin built by `definePlugin` now carries its options `schema`, like adapters and parsers.

`@kubb/adapter-oas`, `@kubb/parser-ts`, `@kubb/parser-md`, and `@kubb/plugin-barrel` ship their `kubb.json`.
