# Changelog

## v5.9.1 — Oct 13, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Parse OpenAPI 3.2 `query` operations (the HTTP QUERY method, RFC 10008) instead of dropping them. They become operation nodes with method `QUERY`, so plugins generate types and clients for them, and `HttpMethod` includes `'QUERY'`. ([#4285](https://github.com/kubb-labs/kubb/pull/4285), [`3430612`](https://github.com/kubb-labs/kubb/commit/3430612fa4fcd35933bd493140e6f38a562361f4))

### @kubb/ast

#### Bug Fixes

- Remove `defineNode`, `NodeDef`, `nodeDefs` and the `*Def` objects from `@kubb/ast`. Node factories are plain functions, `createOutput` no longer shares one `files` array between outputs, and `StatusCode` accepts any three-digit HTTP status string. ([#4278](https://github.com/kubb-labs/kubb/pull/4278), [`75c37f3`](https://github.com/kubb-labs/kubb/commit/75c37f34190b41563b259761ab34b5dbf13fec77))

### @kubb/claude-plugin

#### Bug Fixes

- Read plugin dependencies from each plugin's `kubb-extension.json`, so framework plugins get a client plugin. ([#4275](https://github.com/kubb-labs/kubb/pull/4275), [`1814075`](https://github.com/kubb-labs/kubb/commit/1814075f207a44048e700c1faf73423b03e9834d))

### @kubb/cli

#### Bug Fixes

- The `kubb` bins pass `process.argv.slice(2)` to `run`, whose `argv` parameter now takes the command arguments without the executable and script entries. ([#4278](https://github.com/kubb-labs/kubb/pull/4278), [`75c37f3`](https://github.com/kubb-labs/kubb/commit/75c37f34190b41563b259761ab34b5dbf13fec77))
- `kubb init` takes its plugins from the Kubb registry, adds them like `kubb add`, and stops before installing when a plugin's dependencies or client plugin are missing. ([#4275](https://github.com/kubb-labs/kubb/pull/4275), [`1814075`](https://github.com/kubb-labs/kubb/commit/1814075f207a44048e700c1faf73423b03e9834d))

### @kubb/core

#### Bug Fixes

- Report extension crashes with their own diagnostic code and a link to the extension's issue tracker. A plugin crash is now `KUBB_PLUGIN_FAILED` instead of `KUBB_UNKNOWN`, and adapter and parser crashes are the new `KUBB_ADAPTER_FAILED` and `KUBB_PARSER_FAILED`. Set `meta.issues` on an extension and Kubb prints it as a `report:` line under the error, so users report bugs to the extension's maintainers instead of to Kubb. Run with `--verbose` to print the crash's stack trace. ([#4279](https://github.com/kubb-labs/kubb/pull/4279), [`30d7339`](https://github.com/kubb-labs/kubb/commit/30d7339d9d9cb16a079ef844def2a058db26a174))
- Rename `PluginFactoryOptions` to `PluginType`. Remove `KubbDriver.dispatch` (use `driver.fileManager.dispatch`) and `KubbDriver.hasHookGenerators`. The `file` reporter now prints the same summary as the cli reporter, with timings under `## Summary`. ([#4278](https://github.com/kubb-labs/kubb/pull/4278), [`75c37f3`](https://github.com/kubb-labs/kubb/commit/75c37f34190b41563b259761ab34b5dbf13fec77))
- Add `optionalDependencies` to `kubb-extension.json` and reject an unknown `role`. ([#4275](https://github.com/kubb-labs/kubb/pull/4275), [`1814075`](https://github.com/kubb-labs/kubb/commit/1814075f207a44048e700c1faf73423b03e9834d))

### @kubb/kit

#### Bug Fixes

- Rename `PluginFactoryOptions` to `PluginType`. ([#4278](https://github.com/kubb-labs/kubb/pull/4278), [`75c37f3`](https://github.com/kubb-labs/kubb/commit/75c37f34190b41563b259761ab34b5dbf13fec77))
- Remove `Url.toTemplateString` and `Url.toObject`, which no generator used. `Url.toPath` and `Url.toGroupedTemplateString` stay. ([#4278](https://github.com/kubb-labs/kubb/pull/4278), [`75c37f3`](https://github.com/kubb-labs/kubb/commit/75c37f34190b41563b259761ab34b5dbf13fec77))

### @kubb/studio

#### Bug Fixes

- A `set` or `remove` config edit can name the config's `adapter` or one of its `parsers` through `kind`, and `readConfig` reports their factory calls next to the plugins, so Studio can save adapter and parser options to `kubb.config.ts`. ([#4282](https://github.com/kubb-labs/kubb/pull/4282), [`d1f4a8e`](https://github.com/kubb-labs/kubb/commit/d1f4a8e5fa94051c84d7397d4091c3057100c054))
- Report the adapter and the parsers in the connect payload, named like plugins with a JSON copy of their options, and accept parser option overrides in a generate request so Studio can render and edit them from their manifests. ([#4276](https://github.com/kubb-labs/kubb/pull/4276), [`ba3a367`](https://github.com/kubb-labs/kubb/commit/ba3a3672f554847c3b768d01fe93ca0db2cc7434))
- `createSnapshot` declares a third-party plugin by the package that ships its manifest instead of failing with `Missing dependencies: @kubb/plugin-x`. ([#4278](https://github.com/kubb-labs/kubb/pull/4278), [`75c37f3`](https://github.com/kubb-labs/kubb/commit/75c37f34190b41563b259761ab34b5dbf13fec77))
- Drop the unused `importName` field of the `add-plugin` config edit, the `file` field of `SaveResult`, the `InstalledExtensions` export of the package root (now in `@kubb/studio/protocol`), and the `@kubb/core` type re-exports from `@kubb/studio/protocol`. Import those types from `@kubb/core`.
  
  A `null` option value from Studio now unsets the value from `kubb.config.ts` for that generate, so the extension's default applies again. ([#4278](https://github.com/kubb-labs/kubb/pull/4278), [`75c37f3`](https://github.com/kubb-labs/kubb/commit/75c37f34190b41563b259761ab34b5dbf13fec77))

### kubb

#### Bug Fixes

- Remove the "See also" sections from the docs. Each page links what it needs inline. ([#4276](https://github.com/kubb-labs/kubb/pull/4276), [`ba3a367`](https://github.com/kubb-labs/kubb/commit/ba3a3672f554847c3b768d01fe93ca0db2cc7434))

### Contributors

Thanks to everyone who contributed to this release:

[@mohammad-naji7](https://github.com/mohammad-naji7), [@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.9.0 — Oct 13, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Fix extension docs and registry descriptions that did not match the code, and give each extension page on kubb.dev the same sections: Setup, Options worth knowing, and Example.
  
  - `adapterOas`: without `contentType`, Kubb keeps every media type an operation declares. `integerType` applies only to `int64` and `uint64` schemas. The page also says when the adapter downloads a remote spec or reads files outside the spec's folder.
  - `parserTs`: each `extension` key is the extension of the generated file, so `parserTsx` needs its own `.tsx` key.
  - `parserMd`: the frontmatter example no longer adds a second `# API Reference` H1.
  - `pluginBarrel`: generator plugins write their own barrels, and the root barrel is written only when `output.barrel` is set. `pluginBarrel()` takes no arguments, and the README no longer shows `type: 'named'` or `'propagate'`. ([#4268](https://github.com/kubb-labs/kubb/pull/4268), [`5fc79da`](https://github.com/kubb-labs/kubb/commit/5fc79da61733edd9add6639db077e2494ee7ce67))

### @kubb/cli

#### Features

- Install, update, and list reviewed plugins, adapters, and parsers from the Kubb registry at `https://kubb.dev/registry`. Registry support landed across 5.8.1 to 5.8.4 and is stable from this release.
  
  - `kubb add <id>` installs an extension at the version the registry pins, after it checks that the extension supports your Kubb version. It also adds a plugin to `kubb.config.ts`.
  - `kubb update` moves installed extensions to the registry version, and `kubb update --check` only lists the updates. `kubb list` shows each installed extension and whether an update exists.
  - A package joins the registry with a `kubb-extension.json` manifest. Each entry pins one npm version or one GitHub release, and Studio runs installed third-party plugins that ship a manifest.
  - `defineExtension` defines a plugin, an adapter, or a parser. `definePlugin`, `defineParser`, and `createAdapter` still work but are deprecated.
  - `KUBB_REGISTRY` points the CLI at another registry.
  
  ```shell
  kubb add plugin-zod
  kubb update --check
  kubb list
  ``` ([#4271](https://github.com/kubb-labs/kubb/pull/4271), [`329b478`](https://github.com/kubb-labs/kubb/commit/329b478aeebc9fb416615b4f3012e2d24ec15b38))

#### Bug Fixes

- Keep `kubb mcp` stdout free of the CLI header, so MCP clients receive only JSON-RPC messages. The header line and the blank line after it broke the MCP stdio rule that stdout carries only protocol messages. ([#4270](https://github.com/kubb-labs/kubb/pull/4270), [`193b67a`](https://github.com/kubb-labs/kubb/commit/193b67abeabe348c6ab977d424ae53a822788144))

### unplugin-kubb

#### Bug Fixes

- Make every bundler integration generate once per build, and fail the build when generation cannot run.
  
  - Generate once per plugin instance. webpack and Rspack no longer rebuild forever in watch mode with `output.clean`, and Astro no longer generates twice.
  - Register the Nuxt module with the Rspack builder too, and generate only in the client build of `nuxt build`. The module now needs `@nuxt/kit` 3.14 or later.
  - Fail the build when `config` is missing. webpack, Rspack, esbuild, and Farm used to log and continue, and Vite and Rolldown threw a `TypeError`.
  - Log `✗ Generation failed` and an error count when generation fails, matching the CLI, instead of `✓ Generation completed`. ([#4266](https://github.com/kubb-labs/kubb/pull/4266), [`3f0d5ed`](https://github.com/kubb-labs/kubb/commit/3f0d5ed496c5236b8d321eb5cc7398d81e7da902))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.8.4 — Oct 13, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Require Kubb 5.8.3 or later in `kubb-extension.json`. ([#4262](https://github.com/kubb-labs/kubb/pull/4262), [`92f9e12`](https://github.com/kubb-labs/kubb/commit/92f9e12ef22bd541df9450e115108551ba467935))

### @kubb/core

#### Bug Fixes

- Registry entries can pin a GitHub release. `RegistryArtifact` adds `{ kind: 'github', package, version, owner, repo, tag, commit }`, and `isRegistryEntry` accepts it. `kubb add` and `kubb update` install it as `github:<owner>/<repo>#<commit>`. ([#4264](https://github.com/kubb-labs/kubb/pull/4264), [`68381fd`](https://github.com/kubb-labs/kubb/commit/68381fd34c6d1667024a8a06e7bdf8b392045f88))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.8.3 — Oct 13, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Ship the overview, options page, and how-to guides in a `docs/` folder instead of `OVERVIEW.md`. ([#4260](https://github.com/kubb-labs/kubb/pull/4260), [`fcd208d`](https://github.com/kubb-labs/kubb/commit/fcd208d9f96d1a5d3feb24c9d0a1bbcbc54f7055))

### @kubb/core

#### Bug Fixes

- Add `maintainers` and `dependencies` to `kubb-extension.json`. Add optional `options` and `guides` fields to `RegistryDetail`, and export the new `RegistryGuide` type. ([#4260](https://github.com/kubb-labs/kubb/pull/4260), [`fcd208d`](https://github.com/kubb-labs/kubb/commit/fcd208d9f96d1a5d3feb24c9d0a1bbcbc54f7055))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.8.2 — Oct 13, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Define `adapterOas`, the parsers, and `pluginBarrel` with `defineExtension`. ([#4258](https://github.com/kubb-labs/kubb/pull/4258), [`ae50bb8`](https://github.com/kubb-labs/kubb/commit/ae50bb86a1f6e6f5042b757ad88b419de90d5672))

### @kubb/core

#### Bug Fixes

- Add `defineExtension` to define a plugin, an adapter, or a parser, and deprecate `definePlugin`, `defineParser`, and `createAdapter` in favor of it.
  
  - Set `kind` to `'plugin'`, `'adapter'`, or `'parser'`. The rest of the object is the same as before, except that a parser takes `build`. `defineParser` still accepts the deprecated `setup` alias, but `defineExtension` does not.
  - Export `defineExtension` from `@kubb/core` and `@kubb/kit`.
  - Keep `definePlugin`, `defineParser`, and `createAdapter` working, now marked `@deprecated`.
  
  ```ts
  // Before
  export const pluginZod = definePlugin<PluginZod>({
    meta: { name: 'plugin-zod' },
    setup(options, kubb) {
      kubb.addGenerator(zodGenerator)
      return options
    },
  })
  
  // After
  export const pluginZod = defineExtension<PluginZod>({
    kind: 'plugin',
    meta: { name: 'plugin-zod' },
    setup(options, kubb) {
      kubb.addGenerator(zodGenerator)
      return options
    },
  })
  ``` ([#4258](https://github.com/kubb-labs/kubb/pull/4258), [`ae50bb8`](https://github.com/kubb-labs/kubb/commit/ae50bb86a1f6e6f5042b757ad88b419de90d5672))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.8.1 — Oct 13, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Ship a `kubb-extension.json` manifest and an `OVERVIEW.md` with each package. ([#4253](https://github.com/kubb-labs/kubb/pull/4253), [`b5f137e`](https://github.com/kubb-labs/kubb/commit/b5f137e206d102a29cc3f508d69d50c2305a26e3))

### @kubb/cli

#### Bug Fixes

- Add `kubb add`, `kubb update`, and `kubb list` to install and update extensions from the Kubb registry. ([#4253](https://github.com/kubb-labs/kubb/pull/4253), [`b5f137e`](https://github.com/kubb-labs/kubb/commit/b5f137e206d102a29cc3f508d69d50c2305a26e3))

### @kubb/core

#### Bug Fixes

- `createAdapter` takes an object with `meta`, `setup`, and `build`, like `definePlugin`. Kubb checks the adapter's `meta.compatibility` too.
  
  ```ts
  export const adapterGraphql = createAdapter<AdapterGraphql>({
    meta: { name: 'graphql', compatibility: { kubb: '>=5.8.0' } },
    setup: (options) => ({ ...options, scalars: options.scalars ?? {} }),
    build: (options) => ({ document: null, parse, validate }),
  })
  ```
  
  `defineParser` takes `build` in place of `setup`, and the parser exposes its `options`. The factory form of `createAdapter` and the parser `setup` key are deprecated. ([#4249](https://github.com/kubb-labs/kubb/pull/4249), [`3139832`](https://github.com/kubb-labs/kubb/commit/31398322aacb1cb599662ae54b99cef0ddbdd6e6))
- Add the `kubb-extension.json` manifest types and checks, exported from `@kubb/core` and `@kubb/kit`, and let Studio run installed third-party plugins that ship one. ([#4253](https://github.com/kubb-labs/kubb/pull/4253), [`b5f137e`](https://github.com/kubb-labs/kubb/commit/b5f137e206d102a29cc3f508d69d50c2305a26e3))
- Remove the options `schema` from `definePlugin`, with `PluginOptions`, `StandardSchemaV1`, `plugin.parsedOptions`, the `KUBB_INVALID_OPTIONS` diagnostic, and `@kubb/kit/options`. Type plugin options with TypeScript and apply their defaults in `setup`. `@kubb/kit` no longer depends on `zod`. ([#4252](https://github.com/kubb-labs/kubb/pull/4252), [`2a73acb`](https://github.com/kubb-labs/kubb/commit/2a73acba5e59a0dbbec61c1cb6becb23eef379eb))

### @kubb/plugin-barrel

#### Bug Fixes

- A `barrel: false` plugin that writes to the output root (`output.path` of `'.'` or `''`) no longer removes every other plugin's barrel or empties the root barrel. The barrel plugin now excludes only the files that plugin owns, matched by `meta.pluginName`. Files without an owner are still excluded by the `barrel: false` plugin's subdirectory, as before. A plugin without an `output.path` no longer throws a `TypeError`. ([#4254](https://github.com/kubb-labs/kubb/pull/4254), [`1bfc37a`](https://github.com/kubb-labs/kubb/commit/1bfc37ae6ad637187a4597117ec152c2f73c38da))
- Keep the per-plugin barrels of other plugins when a plugin has no `output.path`. A plugin whose output resolves to the output root, such as a third-party plugin without an `output` option, no longer gets a barrel of its own or claims the other plugins' directories. The root barrel still re-exports its files. ([#4255](https://github.com/kubb-labs/kubb/pull/4255), [`eea0d0d`](https://github.com/kubb-labs/kubb/commit/eea0d0d63a1b6e42b8cc7238e41b75b0393f425d))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.8.0 — Oct 12, 2026

### @kubb/core

#### Bug Fixes

- Add `schema` to `definePlugin` to validate plugin options with any Standard Schema. ([#4244](https://github.com/kubb-labs/kubb/pull/4244), [`6145209`](https://github.com/kubb-labs/kubb/commit/614520944348d43aeb8c13d8dcdd2683b6631135))
- Fix `KUBB_NO_CONTEXT` for plugins that a CommonJS config loads. The ESM and CommonJS builds of `@kubb/core` now share one plugin context, so composables such as `setResolver()` work in both. ([#4246](https://github.com/kubb-labs/kubb/pull/4246), [`dcf2485`](https://github.com/kubb-labs/kubb/commit/dcf24857f35aa665c0dc1e07c7ebe703795c7a02))

### @kubb/kit

#### Features

- Add `@kubb/kit/options` with shared Zod schemas for common plugin options. ([#4245](https://github.com/kubb-labs/kubb/pull/4245), [`d2e57fb`](https://github.com/kubb-labs/kubb/commit/d2e57fbb74340e963c5ebf425d735558487ae173))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.7.0 — Oct 12, 2026

### @kubb/core

#### Features

- `definePlugin` and `defineParser` accept an object with `meta`. Plugins also take `dependencies` and `setup(options, kubb)`. The factory form and `name` are deprecated, and `name` is optional when `meta.name` is set.
  
  Before:
  
  ```ts
  export const pluginZod = definePlugin<PluginZod>((options) => ({
    name: 'plugin-zod',
    dependencies: ['plugin-ts'],
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.addGenerator(zodGenerator)
        ctx.setOptions({ ...options, inferred: options.inferred ?? false })
      },
    },
  }))
  ```
  
  After:
  
  ```ts
  export const pluginZod = definePlugin<PluginZod>({
    meta: { name: 'plugin-zod', version: '5.7.0', compatibility: { kubb: '>=5.7.0' } },
    dependencies: { 'plugin-ts': { version: '>=5.0.0' } },
    setup(options, kubb) {
      kubb.addGenerator(zodGenerator)
      return { ...options, inferred: options.inferred ?? false }
    },
  })
  ```
  
  A mismatch in `meta.compatibility` or `dependencies` fails the run with `KUBB_INCOMPATIBLE_EXTENSION`, `KUBB_MISSING_DEPENDENCY`, or `KUBB_INCOMPATIBLE_DEPENDENCY`. ([#4241](https://github.com/kubb-labs/kubb/pull/4241), [`dfe8df8`](https://github.com/kubb-labs/kubb/commit/dfe8df8364f5fdbe80587036d955c36407ee4edd))
- Add composables to `kubb/kit`, so plugins can call `addGenerator()` and the other setup helpers inside `kubb:plugin:setup` without passing `ctx` around.
  
  - `addGenerator()`, `setResolver()`, `addMacro()`, `setMacros()`, `setOptions()`, `injectFile()`, and `requirePlugin()` each call the `ctx` method with that name. `requirePlugin(name)` is typed through `Kubb.PluginRegistry`.
  - `useOptions()` and `useConfig()` return `ctx.options` and `ctx.config`.
  - `useKubb()` returns the setup context. `tryUseKubb()` returns `undefined` outside setup.
  
  The context survives an `await` in setup and is scoped to one plugin at a time. Calling a composable outside setup fails with the new `KUBB_NO_CONTEXT` diagnostic.
  
  ```ts
  import { addGenerator, definePlugin, setResolver } from 'kubb/kit'
  
  export const pluginExample = definePlugin(() => ({
    name: 'plugin-example',
    hooks: {
      async 'kubb:plugin:setup'() {
        await loadTemplates()
        setResolver(resolverExample)
        addGenerator(exampleGenerator)
      },
    },
  }))
  ``` ([#4240](https://github.com/kubb-labs/kubb/pull/4240), [`f7ee401`](https://github.com/kubb-labs/kubb/commit/f7ee4014038910fc2932629e33f6d9c60801edcd))

### @kubb/plugin-barrel

#### Bug Fixes

- Define `pluginBarrel` with the object form of `definePlugin`. ([#4241](https://github.com/kubb-labs/kubb/pull/4241), [`dfe8df8`](https://github.com/kubb-labs/kubb/commit/dfe8df8364f5fdbe80587036d955c36407ee4edd))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.6.3 — Oct 12, 2026

### @kubb/core

#### Bug Fixes

- Add generic checks for plugin setup, so plugins no longer need their own helpers.
  
  - `ctx.requirePlugin(name)` in `kubb:plugin:setup` returns the plugin, or fails the run with `KUBB_PLUGIN_NOT_FOUND`. The error names the plugin that needs it.
  - `assertPluginOption({ plugin, option, value, allowed })` fails with `KUBB_INVALID_PLUGIN_OPTIONS` and lists the allowed values when an option holds anything else.
  - `createMockedSetupContext()` in `@kubb/kit/testing` builds the setup context for unit tests. Its `requirePlugin` fails like the real one.
  
  A plugin listed in `dependencies` but missing from the config no longer logs a `KUBB_PLUGIN_NOT_FOUND` warning. `dependencies` still declares the plugins a plugin builds on; call `ctx.requirePlugin` as well when the plugin cannot work without one. ([#4238](https://github.com/kubb-labs/kubb/pull/4238), [`4cc8047`](https://github.com/kubb-labs/kubb/commit/4cc804767d48713c1aa3c09c8820827acbce1f81))

### @kubb/mcp

#### Bug Fixes

- Validate MCP tool arguments with Zod Mini instead of valibot, so Kubb uses one validation library. Tool input schemas stay the same. Invalid arguments now return Zod's error messages, such as `Too small: expected string to have >=1 characters`. ([#4234](https://github.com/kubb-labs/kubb/pull/4234), [`80825c4`](https://github.com/kubb-labs/kubb/commit/80825c4c0f14efaf71d55fc706a5b8ca2a83215e))

### @kubb/studio

#### Bug Fixes

- Harden the `kubb studio` agent with safer config edits, sandbox spec checks, and live reloads of JavaScript configs.
  
  - Send Studio a JSON copy of plugin options, so config functions are never callable from Studio, and accept only inline spec content in a sandbox agent.
  - Validate each config edit on its own, refuse `__proto__`, `constructor`, and `prototype` keys, and rewrite only the text an edit targets, including in `module.exports` configs.
  - Reload `kubb.config.js`, `.mjs`, and `.cjs` on every generation instead of keeping the first version.
  - Warn with `KUBB_PLUGIN_NOT_FOUND` for a missing plugin dependency, count a throwing `kubb:plugin:setup` as a failed plugin, and keep the previous output when a run with `output.clean` fails early.
  - Hash in-memory output the way it is written, and clarify the `kubb studio` log lines for in-memory runs, canceled runs, and a takeover. ([#4233](https://github.com/kubb-labs/kubb/pull/4233), [`e1e74ee`](https://github.com/kubb-labs/kubb/commit/e1e74ee3f78ff5430dcfc05bfe4062e35228b9b1))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.6.2 — Oct 11, 2026

### @kubb/studio

#### Bug Fixes

- Fix `kubb studio snapshot` failing with `Cannot read properties of undefined (reading 'readItem')` when `kubb.config.ts` does not set `storage`. The snapshot now reads the generated files from the default fs storage. ([#4231](https://github.com/kubb-labs/kubb/pull/4231), [`6876c64`](https://github.com/kubb-labs/kubb/commit/6876c6476318bc983af0f2b094ceac7371541624))
- Remove the `kubb-snapshot-*` temp folder when two generated files sanitize to the same path, instead of leaving it behind. ([#4229](https://github.com/kubb-labs/kubb/pull/4229), [`905f027`](https://github.com/kubb-labs/kubb/commit/905f027ca7a4b90fdca84a9c78cedd2f0c98f19a))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.6.1 — Oct 11, 2026

### @kubb/cli

#### Bug Fixes

- Rebuild once per editor save in `kubb generate --watch`. An atomic save (write a temp file, then rename it) could trigger two rebuilds, because the 100 ms debounce matched chokidar's 100 ms atomic-save window. The debounce is now 250 ms. ([#4227](https://github.com/kubb-labs/kubb/pull/4227), [`4ba64cf`](https://github.com/kubb-labs/kubb/commit/4ba64cf431201531556e41efd7b7ca2ea386d1a9))

### @kubb/core

#### Bug Fixes

- Add `kubbStorage`, an unstorage fs storage for the files Kubb keeps for itself under `~/.kubb`, with a temp folder as fallback.
  
  - Use `kubbStorage({ base })` or `resolveKubbDir(base)` to resolve `base` inside `KUBB_HOME` (default `~/.kubb`). An absolute `base` is used as is, and a folder that is not writable falls back to the OS temp directory.
  - Keep the files private: the folder gets mode 0700.
  - Write `file` and `html` reports to `.kubb` through it.
  - Name log files after the config with every character other than letters, digits, `_`, and `-` replaced by `-`, as the `html` reporter already did.
  - Keep existing pairings: `kubb studio` reads its credential and machine secret from the same files under `~/.kubb/projects`.
  
  ```typescript
  import { kubbStorage } from '@kubb/core'
  
  const storage = kubbStorage({ base: 'cache' })
  await storage.setItem('last-run.json', { at: Date.now() })
  ``` ([#4225](https://github.com/kubb-labs/kubb/pull/4225), [`30f9f4d`](https://github.com/kubb-labs/kubb/commit/30f9f4d1bd4bf190564d54b953e8b6e27a558c3a))

### @kubb/studio

#### Bug Fixes

- Connect to Kubb Studio over one WebSocket, and publish CI snapshots in one request. Needs a Kubb Studio release that accepts Kubb 5.6.1 agents.
  
  - Replace `runConnection` and `createClient` with `connectAgent`. It resolves on shutdown and rejects with `InvalidAgentTokenError` when Studio refuses the token, so the host pairs again in its own loop. Pass one `hooks` emitter instead of `installLogger`.
  - Replace `createAgent`, `createJob`, and `waitForJob` with `createSnapshot`. It generates like `kubb generate`, with the formatter, the linter, and `output.postGenerate`. It then packs the tarball and sends one `POST /api/snapshots` with the CI API key. Snapshots come only from CI now, so the `publishSnapshot` RPC is gone.
  - Pass a `machineId` to `pairAgent`. `setStorage`, `createFileStorage`, `machineTokenFrom`, `connectWebSocketRpc`, `startPairing`, and `pollForPairingToken` are removed, and the runtime no longer reads `KUBB_AGENT_SECRET`.
  - Rename the `studio:*` hooks to `studio:connected`, `studio:disconnected`, `studio:reconnecting`, `studio:command`, `studio:warn`, and `studio:error`.
  - Drop `--timeout` and the `--allow-*` flags from `kubb studio snapshot`. Overlapping CI runs no longer end each other's session, so they need no `concurrency` group.
  
  ```typescript
  // Before
  await runConnection({ credentials: { token }, clientOptions: () => ({ configPath, loadConfig, version, installLogger }), onTokenRejected: async () => null })
  
  // After
  await connectAgent({ token, configPath, loadConfig, version, hooks, signal })
  ``` ([#4225](https://github.com/kubb-labs/kubb/pull/4225), [`30f9f4d`](https://github.com/kubb-labs/kubb/commit/30f9f4d1bd4bf190564d54b953e8b6e27a558c3a))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.6.0 — Oct 10, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Internal cleanup of `@kubb/adapter-oas` with no change to generated output. ([#4216](https://github.com/kubb-labs/kubb/pull/4216), [`8708135`](https://github.com/kubb-labs/kubb/commit/8708135eb00a2b7d17c29a17b4c2cc89ea6c4da7))

### @kubb/ast

#### Bug Fixes

- Type a `format: 'date-time'` schema as a plain string node in `InferSchemaNode` when `dateType` is `false`, matching what the adapter produces. ([#4217](https://github.com/kubb-labs/kubb/pull/4217), [`396dde2`](https://github.com/kubb-labs/kubb/commit/396dde2496ef1504fdceb32b88f9135140a27d6d))
- Internal cleanup of `@kubb/ast` with no change in behavior. ([#4204](https://github.com/kubb-labs/kubb/pull/4204), [`b87f7e4`](https://github.com/kubb-labs/kubb/commit/b87f7e42e43ddb296ce4fb504ddcf422696f57c2))
- Visit schemas inside a tuple's `rest` and inside `patternProperties`, so refs there are collected, transformed by macros, and imported in generated files.
  
  - `transform`, `collect` and `collectImportedRefNames` now reach `rest` and `patternProperties` on a `SchemaNode`.
  - `createInput()` gives every node its own `schemas`, `operations` and `meta` objects instead of sharing one default. ([#4188](https://github.com/kubb-labs/kubb/pull/4188), [`62485c5`](https://github.com/kubb-labs/kubb/commit/62485c55cd6b6ce5e66f97449d5baeb15f99cc48))

### @kubb/cli

#### Bug Fixes

- Run `output.format`, `output.lint` and `output.postGenerate` through `@kubb/core` instead of the CLI's own copies, so every host runs the same passes. ([#4215](https://github.com/kubb-labs/kubb/pull/4215), [`ecf2b25`](https://github.com/kubb-labs/kubb/commit/ecf2b25c9b254cdc2b46decd725fdb7c4467dbe7))
- Reorganize the CLI internals: config discovery moves to its own module, the logger helpers fold into the loggers that use them, and every command loads its runner the same way. Every command, flag and printed line stays the same. ([#4211](https://github.com/kubb-labs/kubb/pull/4211), [`a2c9cd7`](https://github.com/kubb-labs/kubb/commit/a2c9cd7267620c60b5855d16e6e4374a18611522))
- `kubb studio` accepts a flag value after a space, such as `kubb studio --open --url http://localhost:3000` or `--config ./kubb.config.ts`, instead of failing with "Command not found". ([#4221](https://github.com/kubb-labs/kubb/pull/4221), [`8dc93fc`](https://github.com/kubb-labs/kubb/commit/8dc93fc76e63f8c49172cdc04568cb00695c5d33))
- Keep stdout clean for the MCP stdio transport: the telemetry notice and the `kubb mcp` startup banner print on stderr, so the JSON-RPC stream no longer starts with a stray line. `@kubb/mcp` also declares `jiti` as a dependency instead of bundling its own copy. ([#4189](https://github.com/kubb-labs/kubb/pull/4189), [`10c1f3b`](https://github.com/kubb-labs/kubb/commit/10c1f3b6de887e2cc9deedd8d2d25c596dddef92))

### @kubb/core

#### Features

- Run `output.format`, `output.lint` and `output.postGenerate` from `Kubb.generate()` by default, so every host gets the same passes.
  
  - Adds `runOutputPasses` and `runHook`, the one implementation of the format, lint and post-generate steps. `runHook` spawns the command with `node:child_process`, in the config `root`, and emits `kubb:hook:start`, `kubb:hook:line` and `kubb:hook:end` itself.
  - `generate({ processOutput })` still replaces the passes when a host needs to; its context now also carries `hooks` and `signal`.
  - `unplugin-kubb` and `kubb mcp` start honoring `output.format`, `output.lint` and `output.postGenerate`, which they ignored before. ([#4196](https://github.com/kubb-labs/kubb/pull/4196), [`50617dd`](https://github.com/kubb-labs/kubb/commit/50617ddbe0c5a1b0ae78ffab3b8efb0a90bd5295))

#### Bug Fixes

- Import types from the modules that define them instead of internal re-export barrels. The public exports are unchanged. ([#4222](https://github.com/kubb-labs/kubb/pull/4222), [`2667074`](https://github.com/kubb-labs/kubb/commit/2667074a89d1753e5fb8a63643de6eb0cc1874b0))
- Run `output.format`, `output.lint` and `output.postGenerate` commands through `tinyexec`, which resolves Windows command shims and the project's `node_modules/.bin`.
  
  Formatter and linter detection for `'auto'` also finds a tool installed only in `node_modules/.bin` under `config.root`, the folder the tool then runs from. The browser opener and the `kubb studio start` background worker spawn through `tinyexec` too. ([#4218](https://github.com/kubb-labs/kubb/pull/4218), [`0fb79d5`](https://github.com/kubb-labs/kubb/commit/0fb79d56b52c32d621875857135877b26b001ab0))
- Fold single-use helpers and duplicated types in the core driver, resolver, storage and diagnostics. Generated output and the plugin API do not change. ([#4203](https://github.com/kubb-labs/kubb/pull/4203), [`d1b5a6a`](https://github.com/kubb-labs/kubb/commit/d1b5a6a717fde727c0a9c0bfb3ab72aa8e60e844))
- Keep a failing hook listener's error message to the hook name. The message no longer serializes the hook arguments, which could be a whole config or AST subtree. ([#4193](https://github.com/kubb-labs/kubb/pull/4193), [`ee09318`](https://github.com/kubb-labs/kubb/commit/ee09318741f86c00512f3c862e9d0e05aadd6f95))
- Correct three doc comments so they match what the code does: `group.name` keeps the first path segment as written for `path` groups, the `defaultBanner` example shows the banner Kubb writes, and the Studio heartbeat note says a ping is persisted at most once an hour. ([#4186](https://github.com/kubb-labs/kubb/pull/4186), [`425998f`](https://github.com/kubb-labs/kubb/commit/425998fb04946afc1493f22ee859eadb1f3b8d8c))

### @kubb/kit

#### Bug Fixes

- `@kubb/kit` now exports the `Diagnostic` type. `@kubb/ast` exports `collectSchemaRefs`, the set of schema names a node references. `@kubb/adapter-oas` depends on `@kubb/kit` only, with no change to generated output. ([#4210](https://github.com/kubb-labs/kubb/pull/4210), [`76d1ec8`](https://github.com/kubb-labs/kubb/commit/76d1ec8048ba3d8decaf07d354d7132d7cbc8790))

### @kubb/mcp

#### Bug Fixes

- The `validate` tool no longer prints the unreachable 'install @kubb/adapter-oas' hint. ([#4197](https://github.com/kubb-labs/kubb/pull/4197), [`465e220`](https://github.com/kubb-labs/kubb/commit/465e2205fd1d90b1f3bb40f11a2030f0cb0f0042))

### @kubb/parser-ts

#### Bug Fixes

- Load TypeScript only on the first `print` or `copy` call, so a run that only parses files starts faster. ([#4205](https://github.com/kubb-labs/kubb/pull/4205), [`12428cc`](https://github.com/kubb-labs/kubb/commit/12428cc4898029beda20d35fb8f34fcf402d66e4))
- Resolve a relative import path from the importing file's directory instead of dropping the first `../`, which produced a wrong path when the target sat outside that directory. ([#4190](https://github.com/kubb-labs/kubb/pull/4190), [`2dbb0cd`](https://github.com/kubb-labs/kubb/commit/2dbb0cdc3611ef0449979f9195dfe792900d068d))

### @kubb/plugin-barrel

#### Bug Fixes

- The `@kubb/core` peer dependency warning is gone. A plugin `output.path` that resolves outside `config.output.path` is now reported as a `KUBB_PATH_TRAVERSAL` diagnostic. Generated barrels are unchanged. ([#4202](https://github.com/kubb-labs/kubb/pull/4202), [`e872176`](https://github.com/kubb-labs/kubb/commit/e87217657f9bd7c2ac96ff4cf65354a1307ab8f0))

### @kubb/renderer-jsx

#### Bug Fixes

- Type JSX children as an array instead of any iterable, which the renderer never walked, so a `Set` or generator passed as children is now a type error instead of silently rendering nothing. The element type also carries its `$typeof` brand, and the renderer only walks elements the Kubb JSX runtime created. ([#4192](https://github.com/kubb-labs/kubb/pull/4192), [`068f4a9`](https://github.com/kubb-labs/kubb/commit/068f4a9ec2f193b4f29f8492d741819bb75155b0))
- Internal rewrite of the JSX renderer with no change to the rendered `FileNode` output. ([#4202](https://github.com/kubb-labs/kubb/pull/4202), [`e872176`](https://github.com/kubb-labs/kubb/commit/e87217657f9bd7c2ac96ff4cf65354a1307ab8f0))

### @kubb/studio

#### Features

- Studio runs a generation through `@kubb/core`, so the format, lint and `output.postGenerate` passes run inside core. A failing pass fails the job and arrives as a `kubb:diagnostic` event with the code `KUBB_FORMAT_FAILED`, `KUBB_LINT_FAILED` or `KUBB_POST_GENERATE_FAILED`. The output manifest is committed after the passes, so the next run skips files the formatter already handled. ([#4214](https://github.com/kubb-labs/kubb/pull/4214), [`56a24f2`](https://github.com/kubb-labs/kubb/commit/56a24f23d7acf8bb13ee279d9f7f0f59e812b1da))

#### Bug Fixes

- Internal cleanup of `@kubb/studio`. A config edit whose value is a class instance, such as a `Date`, is now refused as not a literal, matching the protocol's `OptionValue` type. ([#4208](https://github.com/kubb-labs/kubb/pull/4208), [`9971e64`](https://github.com/kubb-labs/kubb/commit/9971e64685124daea7dc06a383a3f4519deae34f))
- Accept `[::1]` as a loopback host for plaintext snapshot uploads, matching the WebSocket check, so a local Studio reachable over IPv6 works the same as over IPv4. ([#4191](https://github.com/kubb-labs/kubb/pull/4191), [`86e5ed7`](https://github.com/kubb-labs/kubb/commit/86e5ed787f9c6a792b6f1ac74225812c4d9f75af))
- Use the global `WebSocket` (Node 22 and later) instead of the `ws` package for the agent connection.
  
  - A failed handshake still settles as close code 1006. ([#4212](https://github.com/kubb-labs/kubb/pull/4212), [`caf454f`](https://github.com/kubb-labs/kubb/commit/caf454ff04a46aaa7e8b3819889b3cf830cf56fd))

### unplugin-kubb

#### Bug Fixes

- `unplugin-kubb` declares `@kubb/core` as a dependency only, so the peer dependency warning is gone. `@kubb/parser-md` has no behavior change. ([#4201](https://github.com/kubb-labs/kubb/pull/4201), [`719f6bd`](https://github.com/kubb-labs/kubb/commit/719f6bdbb927ce82c7bf4bb791d659de4ee2cecd))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.5.6 — Oct 8, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Preserve metadata (`deprecated`, `nullable`, `readOnly`, `writeOnly`, `default`, `examples`) on schemas without explicit `type` when falling back to `emptySchemaType`. ([#4179](https://github.com/kubb-labs/kubb/pull/4179), [`66a20f1`](https://github.com/kubb-labs/kubb/commit/66a20f101ad1efaac2e53ab07ca47b4e67158526))
- Resolve required-only `oneOf` and `anyOf` union branches against sibling schemas and properties. ([#4180](https://github.com/kubb-labs/kubb/pull/4180), [`7e2c4c2`](https://github.com/kubb-labs/kubb/commit/7e2c4c2d38958d6fcddc5ce9c997adf9b6241b97))

### @kubb/cli

#### Bug Fixes

- Report `kubb` as the telemetry service name instead of `kubb-core`. ([#4177](https://github.com/kubb-labs/kubb/pull/4177), [`04e7b50`](https://github.com/kubb-labs/kubb/commit/04e7b501cf27bf1fb56b53e8f5e72bf77ebee250))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle), [@xeoneux](https://github.com/xeoneux)

## v5.5.5 — Oct 7, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Fix a batch of small bugs:
  
  - `@kubb/adapter-oas`: resolve local `$ref` pointers per RFC 6901, so `#/paths/~1pets/get` and keys with `~` or an encoded `/` resolve. On Windows, an absolute input such as `C:\specs\api.yaml` no longer counts as a URL, so a missing file now reports `KUBB_INPUT_NOT_FOUND` instead of failing later.
  - `@kubb/mcp`: reload `kubb.config.ts` on every tool call. The server cached the first load, so edits only showed up after a restart.
  - `@kubb/cli`: `CI=false` and `CI=0` no longer count as running in CI, and `kubb init` detects Bun from `bun.lock` as well as `bun.lockb`.
  - `@kubb/studio`: a failing format, lint or `postGenerate` command reports one `kubb:error` instead of two.
  - `@kubb/renderer-jsx`: fix the `meta` prop type on `<kubb-file>`, which referenced `FileNode` without importing it. ([#4175](https://github.com/kubb-labs/kubb/pull/4175), [`11cd291`](https://github.com/kubb-labs/kubb/commit/11cd291dec1fc7f72e922db82d0d1bb16df4fd61))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.5.4 — Oct 7, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Report spec validation problems as `KUBB_INVALID_SPEC` warnings during `kubb generate`. The adapter validated the spec by default but discarded the result, so an invalid spec generated silently. Each problem is now listed and generation continues. Set `validate: false` on the adapter to skip the check, which on a large spec saves about 20% of the run. ([#4172](https://github.com/kubb-labs/kubb/pull/4172), [`75b2c47`](https://github.com/kubb-labs/kubb/commit/75b2c475a2928c5f6571cd9e1c5ab23efbf80010))

### @kubb/cli

#### Bug Fixes

- Print output and errors for a `kubb.config.ts` that does not use `defineConfig`. Such a config has no `reporters`, so `kubb generate` attached no logger and exited with code 1 without saying why. It now falls back to the built-in reporters. ([#4170](https://github.com/kubb-labs/kubb/pull/4170), [`dd2a728`](https://github.com/kubb-labs/kubb/commit/dd2a72899e1fe18110fe01b930f2f858eb324c07))
- Print one `✗` before an error instead of two. The error handler added its own `✗`, and the spinner it stopped added another, so a failing plugin setup printed `✗ ✗ No client plugin is registered.` ([#4173](https://github.com/kubb-labs/kubb/pull/4173), [`464523a`](https://github.com/kubb-labs/kubb/commit/464523a88194b2734589aaecc423028438e052b6))

### @kubb/parser-ts

#### Bug Fixes

- Load `typescript` with `require` instead of `import`. When ESM code imports a CommonJS package, Node keeps a second copy of its source, and for TypeScript that copy is about 9 MB. With `plugin-ts` and `plugin-zod` loaded, heap drops by about 9 MB and RSS by about 25 MB, which matters most for the long-running `kubb studio` agent. ([#4169](https://github.com/kubb-labs/kubb/pull/4169), [`34b95e8`](https://github.com/kubb-labs/kubb/commit/34b95e89840b327ad24f9448043a02da0b3b8950))

### @kubb/studio

#### Bug Fixes

- Lower the memory the `kubb studio` agent uses while idle. `tsdown` and `magicast` now load only when Studio packs a snapshot or reads or edits `kubb.config.ts`. The agent also drops its reference to a finished generation's output, which held every generated file in memory when `allowWrite` was off. ([#4169](https://github.com/kubb-labs/kubb/pull/4169), [`c705ba7`](https://github.com/kubb-labs/kubb/commit/c705ba7931f7562ceff80a6cf5d2509afba386f1))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.5.3 — Oct 6, 2026

### @kubb/cli

#### Bug Fixes

- Restore the telemetry source header so CLI usage events reach the existing ingestion source. ([`acff588`](https://github.com/kubb-labs/kubb/commit/acff58884dedafcfd41e25ef6294005b2f12b192))
- Make plugin usage easier to filter in telemetry. Send plugin names in `kubb.plugins` and boolean usage flags in `kubb.plugin.<name>`. Preserve detailed options under `kubb.plugin_options`. ([#4167](https://github.com/kubb-labs/kubb/pull/4167), [`4766cf9`](https://github.com/kubb-labs/kubb/commit/4766cf9802306b01202c48cc92896baa820c4b04))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.5.2 — Oct 5, 2026

### @kubb/studio

#### Bug Fixes

- Keep plugin and adapter options from `kubb.config.ts` that can't be sent as JSON, such as `macros`, resolver functions, and `RegExp` patterns, when merging Studio's options for a generate. Before, Studio's lossy copy replaced them, so custom macros stopped running. ([#4162](https://github.com/kubb-labs/kubb/pull/4162), [`d798e0a`](https://github.com/kubb-labs/kubb/commit/d798e0a39712fb104254322cf55c61c7293797ff))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.5.1 — Oct 5, 2026

### @kubb/core

#### Bug Fixes

- Point diagnostic documentation links to the matching sections in the consolidated diagnostic reference. ([#4156](https://github.com/kubb-labs/kubb/pull/4156), [`d3711ad`](https://github.com/kubb-labs/kubb/commit/d3711adc4ac817897a22c6d13f8c5fbc2ff8e7fa))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.5.0 — Oct 5, 2026

### @kubb/adapter-oas

#### Features

- Automatically recognize OpenAPI 3.1 `oneOf`/`anyOf` const unions as named enums when their members have distinct, non-empty titles and distinct string or number values. Member titles and descriptions are retained alongside their original wire values, without an additional adapter option. Recognition runs after Kubb's existing upgrade to OpenAPI 3.1. Ordinary enum unions and incomplete, ambiguous or additionally constrained unions retain their existing representation. Recognition can change generated enum exports, such as a literal-union `Status` type becoming an enum-backed `StatusKey` with `@kubb/plugin-ts` and `enum.type: 'asConst'`. ([#4155](https://github.com/kubb-labs/kubb/pull/4155), [`0d3468f`](https://github.com/kubb-labs/kubb/commit/0d3468fcaa2218cdfecdd3a6813386f5691b0df1))

### Contributors

Thanks to everyone who contributed to this release:

[@pkasarda](https://github.com/pkasarda)

## v5.4.5 — Oct 3, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Numbers with a `format` such as `double`, `float` or `int32` keep their `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum` and `multipleOf` constraints, so `{ type: 'number', format: 'double', minimum: -90, maximum: 90 }` generates `z.number().min(-90).max(90)` again. `int64` and `uint64` now keep `multipleOf` as well. ([#4149](https://github.com/kubb-labs/kubb/pull/4149), [`8ff2b1e`](https://github.com/kubb-labs/kubb/commit/8ff2b1e74cf741965447ad58a33c5d3a1ba12a23))

### @kubb/parser-ts

#### Bug Fixes

- Keep package import and export specifiers unchanged when applying the `extension` option. ([#4147](https://github.com/kubb-labs/kubb/pull/4147), [`31ad673`](https://github.com/kubb-labs/kubb/commit/31ad673781d6c62410c69ed8c5dbf5c5489ab994))

### Contributors

Thanks to everyone who contributed to this release:

[@mheob](https://github.com/mheob), [@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.4.4 — Oct 3, 2026

### @kubb/cli

#### Bug Fixes

- The background worker started by `kubb studio start` now shows up as `Kubb` in process lists, like the main CLI. ([#4145](https://github.com/kubb-labs/kubb/pull/4145), [`81aa079`](https://github.com/kubb-labs/kubb/commit/81aa07992b3a06a426165219ad2c387088ee7f56))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.4.3 — Oct 2, 2026

### @kubb/studio

#### Bug Fixes

- Add an optional `cursor` and `limit` to `readFiles`, so a caller can page through a large generated file. The reply carries only that page's lines plus `pages[path]` with the `nextCursor` (`null` after the last page) and the file's `totalLines`. Reads without a `limit` behave as before. ([#4140](https://github.com/kubb-labs/kubb/pull/4140), [`3bb9df6`](https://github.com/kubb-labs/kubb/commit/3bb9df67383285d2719f98bc30df59368a7ac3e0))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.4.2 — Oct 1, 2026

### @kubb/cli

#### Bug Fixes

- Log Studio commands, warnings and each generation run in the background worker log, so it no longer stops at `connected`. ([#4135](https://github.com/kubb-labs/kubb/pull/4135), [`9e33c7e`](https://github.com/kubb-labs/kubb/commit/9e33c7e8b52a24cc3a1ca387f89628bd6aa0562f))

### kubb

#### Bug Fixes

- Describe Kubb as a way to turn your API spec into type-safe code in the package description, README and CLI intro. ([#4137](https://github.com/kubb-labs/kubb/pull/4137), [`b25ce0d`](https://github.com/kubb-labs/kubb/commit/b25ce0d0ca4e5024a59b6ca7e3dbe3e1ac5c79bc))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.4.1 — Sep 29, 2026

### @kubb/cli

#### Bug Fixes

- Add `kubb studio start` and `stop` for a background connection per project. `status` reports its connection state and log path, and `logout` stops it before removing credentials. Rejected tokens stop the worker until you log in again.

  Use one shared connection loop for the CLI and Docker agent. Abort pending registration on shutdown and wait for canceled generation cleanup before reconnecting. ([#4128](https://github.com/kubb-labs/kubb/pull/4128), [`5d9151c`](https://github.com/kubb-labs/kubb/commit/5d9151c4c74e6c93e215ac24dfff0f270c64e771))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.4.0 — Sep 29, 2026

### @kubb/core

#### Features

- Add `this.import(...)` to printer handlers and `printer.drainImports()`, so a `printer.nodes` handler can declare the import its output needs. Allow `resolver.imports` to be overridden through `ResolverPatch` without a cast. ([#4130](https://github.com/kubb-labs/kubb/pull/4130), [`0d737e2`](https://github.com/kubb-labs/kubb/commit/0d737e227e8c21a37a2554aa7129434843bef811))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.19 — Sep 26, 2026

### @kubb/studio

#### Bug Fixes

- Fix `kubb studio snapshot` saying "No snapshot of `main` to compare with" even when a CI agent for the base branch already exists and simply has no snapshot of this package yet, such as a package newly added in the pull request. `branchChanges` now carries `baseFound`, and the summary line tells the two cases apart: "No snapshot of `main` to compare with" (no agent has run there) versus "No snapshot of `main` for this package yet" (the agent exists, this package is new to it). ([#4123](https://github.com/kubb-labs/kubb/pull/4123), [`3561e19`](https://github.com/kubb-labs/kubb/commit/3561e1977c36056a0727566175c3b40edf8c097d))
- Remove `allowInput` from `AgentPermissions` and the `--allow-input`/`KUBB_AGENT_ALLOW_INPUT` flag. Only a sandbox agent can generate from an OpenAPI spec sent by Studio; every other agent always reads its spec from disk, so this was never actually a permission a host could opt into. ([#4124](https://github.com/kubb-labs/kubb/pull/4124), [`292350e`](https://github.com/kubb-labs/kubb/commit/292350e28f01c65e277cf32288724fb8bc0ca4d8))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.18 — Sep 25, 2026

### @kubb/studio

#### Bug Fixes

- Organize the Studio runtime into protocol, operations, and runtime layers. ([#4121](https://github.com/kubb-labs/kubb/pull/4121), [`63f951a`](https://github.com/kubb-labs/kubb/commit/63f951a6efbdd27208df4e792cded4ea7e22973a))
- `kubb studio snapshot` runs its snapshot job on the agent process it connected, so two overlapping pipelines of the same CI agent never build each other's checkout.
  
  - `createJob` accepts `instanceId`, and sends it on `POST /api/jobs`. A Studio that does not know the field ignores it.
  - `createClient` accepts an `instanceId`, so a host that queues its own jobs can name its process. Without one, each client still gets a random id. ([#4119](https://github.com/kubb-labs/kubb/pull/4119), [`955b6b5`](https://github.com/kubb-labs/kubb/commit/955b6b557135d18b173aa237bd0876dac388abef))
- Remove `memoryBudgetMb` from `AgentCapacity`, along with the `KUBB_AGENT_MEMORY_BUDGET_MB` environment variable. An agent no longer refuses a job for memory, and its heartbeat always reports `accepting: true`. ([#4117](https://github.com/kubb-labs/kubb/pull/4117), [`d3996ef`](https://github.com/kubb-labs/kubb/commit/d3996ef6ead14995ade6378963ee0e45b9bbd5f5))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.17 — Sep 25, 2026

### @kubb/studio

#### Bug Fixes

- Improve Studio agent connections, job isolation, retries, capacity reporting, and close handling. Add GitHub/GitLab branch snapshots and fail-fast token rejection handling to the CLI. ([#4110](https://github.com/kubb-labs/kubb/pull/4110), [`327bfe9`](https://github.com/kubb-labs/kubb/commit/327bfe9d2a38caacfc0707345a5f532f264b2754))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.16 — Sep 24, 2026

### @kubb/studio

#### Bug Fixes

- Align how `kubb studio`, the Docker agent, and `kubb studio snapshot` pair, connect, and log. The runtime no longer prints or knows its host, pairing takes a `type` through the new `pairAgent`, and snapshots report the files changed since the previous one. ([#4098](https://github.com/kubb-labs/kubb/pull/4098), [`555e057`](https://github.com/kubb-labs/kubb/commit/555e057827aed831b755035ffab2a3e84a120629))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.15 — Sep 24, 2026

### @kubb/core

#### Bug Fixes

- Files emitted with `copy` now follow the parser's `extension` option. Parsers can implement the new `copy(file, source)` hook to turn a copied file into nodes, and `parserTs`/`parserTsx` use it to lift a template's imports and exports into import and export nodes. ([#4096](https://github.com/kubb-labs/kubb/pull/4096), [`050f6f9`](https://github.com/kubb-labs/kubb/commit/050f6f98d4150a2bd9b26d1937a56c1b0a89fd72))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.14 — Sep 24, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Keep a binary response or request body typed as a blob for any non-JSON media type (`application/pdf`, `image/png`, ...), not just `application/octet-stream`. A newer `@scalar/openapi-upgrader` release started emptying `format: 'binary'` schemas for every media type on the OAS 3.1 upgrade, not just `application/octet-stream`, so those bodies fell back to `emptySchemaType` instead of resolving to a blob. ([#4094](https://github.com/kubb-labs/kubb/pull/4094), [`cfcb497`](https://github.com/kubb-labs/kubb/commit/cfcb497977f246d02dac9cc8f88a2a230ab8734e))

### @kubb/ast

#### Bug Fixes

- Add `isBareRef` for detecting unmodified schema references. ([#4093](https://github.com/kubb-labs/kubb/pull/4093), [`c7a9157`](https://github.com/kubb-labs/kubb/commit/c7a91570a9f9ad176fb4580094476406ac5b9997))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.13 — Sep 23, 2026

### @kubb/studio

#### Bug Fixes

- Keep recent generations by job id and snapshot the output directory before each run, so Studio can diff a run against an earlier one or against the files on disk. Agents with a project keep them in `node_modules/.cache/kubb`, so they survive a restart, and sandboxes keep them in memory. `KUBB_AGENT_MAX_GENERATIONS` (default 8), `KUBB_AGENT_MAX_GENERATIONS_MB` (default 100) and `KUBB_AGENT_MAX_SNAPSHOT_MB` (default 50) set the limits. Breaking for the Studio connection: `readFiles` now takes a `jobId` and a `source`, and `GenerateResult.changes` is replaced by `hashes` and `disk.hashes`. `@kubb/core` now exports `cacheStorage`. ([#4090](https://github.com/kubb-labs/kubb/pull/4090), [`7b517b8`](https://github.com/kubb-labs/kubb/commit/7b517b80d2d80a90878e7854528345e3836ebcac))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.12 — Sep 23, 2026

### @kubb/studio

#### Bug Fixes

- Report which files a Studio run added, changed, or removed, and serve the previous run's contents so Studio can show a diff.
  
  - `GenerateResult.changes` maps each path that differs from the session's previous successful run to `added`, `changed`, or `removed`. Unchanged files are left out, and the field is absent on a session's first run.
  - `readFiles` takes `revision: 'previous'` to read the run before the latest one, including files the latest run removed. The previous run is read into memory before the next run starts, so a session that writes to disk can still be diffed after its files are overwritten.
  - A failed run leaves the last successful run as the one to compare against.
  - `FileChange` is exported from `@kubb/studio`. ([#4086](https://github.com/kubb-labs/kubb/pull/4086), [`300186d`](https://github.com/kubb-labs/kubb/commit/300186d94395921012334877c291e8065dd591ef))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.11 — Sep 21, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Generate `Blob` for multipart binary properties after upgrading an OpenAPI 3.0 document to 3.1. ([#4083](https://github.com/kubb-labs/kubb/pull/4083), [`95d93a7`](https://github.com/kubb-labs/kubb/commit/95d93a70c8021bc6aa912be412a3e21b37890bf0))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.10 — Sep 19, 2026

### @kubb/cli

#### Bug Fixes

- Show sponsor tips again for successful `kubb generate` runs and when starting a `kubb studio` session. ([#4077](https://github.com/kubb-labs/kubb/pull/4077), [`15c644e`](https://github.com/kubb-labs/kubb/commit/15c644e427dc7bc522bbf473eba4818bc4ac767c))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.9 — Sep 19, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Update the OpenAPI parser, upgrader, and unplugin dependencies. ([#4068](https://github.com/kubb-labs/kubb/pull/4068), [`d88ab19`](https://github.com/kubb-labs/kubb/commit/d88ab1989b222f8b1012ed046f10bf105139e3e9))

### @kubb/cli

#### Bug Fixes

- Scope Kubb Studio help by subcommand and reject flags passed to the wrong Studio command. ([#4068](https://github.com/kubb-labs/kubb/pull/4068), [`d88ab19`](https://github.com/kubb-labs/kubb/commit/d88ab1989b222f8b1012ed046f10bf105139e3e9))

### kubb

#### Bug Fixes

- Apply the same adapter, parser, and plugin defaults to programmatic `createKubb` builds as the CLI configuration. ([#4072](https://github.com/kubb-labs/kubb/pull/4072), [`4afe194`](https://github.com/kubb-labs/kubb/commit/4afe194a5d88e4ac59813564485e7542d633518c))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.8 — Sep 18, 2026

### @kubb/studio

#### Bug Fixes

- Carry an agent's organization slug through pairing and connecting, so a host can log and trace it
  alongside the agent's own slug.
  
  `PairingResult.agent` and the `studio:connected` hook context gain an optional
  `organizationSlug`, absent for a sandbox or global agent, which has none. `studio:connected` also
  gains `agentSlug`, refreshed on every connect so a rename in Studio shows up without a re-pair.
  Both fields are additive: a host built against an older type just ignores them. ([#4066](https://github.com/kubb-labs/kubb/pull/4066), [`eb5fa50`](https://github.com/kubb-labs/kubb/commit/eb5fa50fedf52a06349813fae039f562225ae240))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.7 — Sep 18, 2026

### @kubb/studio

#### Bug Fixes

- Fix a snapshot package's `package.json` pointing `main`/`module`/`exports['.']` at
  `dist/index.*` even when the generation had no top-level barrel, and add a wildcard
  `exports['./*']` so individual generated files stay importable by path. ([#4064](https://github.com/kubb-labs/kubb/pull/4064), [`d2ce0c4`](https://github.com/kubb-labs/kubb/commit/d2ce0c4af275d7bf89535e64fc0c6bdbfcfaecd1))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.6 — Sep 17, 2026

### @kubb/studio

#### Bug Fixes

- Replace the agent WebSocket command protocol with typed Cap'n Web RPC and remove the legacy JSON envelopes. Agents and Studio must upgrade together; mismatched versions cannot communicate. ([#4061](https://github.com/kubb-labs/kubb/pull/4061), [`f880342`](https://github.com/kubb-labs/kubb/commit/f880342c1dc80611cd4094ced72c7d53e7d46cb5))
- Fix generation and heartbeat lifecycle bugs left over from the Cap'n Web RPC cutover:
  
  - A dropped Studio connection now cancels the in-flight generation instead of letting it finish
    unwatched.
  - Two `startGeneration` calls arriving in the same tick can no longer both start a run.
  - A heartbeat ping that never settles (a half-open socket) now closes the session instead of
    hanging it indefinitely.
  - Removed an unreachable error path left over from the old JSON transport. ([#4061](https://github.com/kubb-labs/kubb/pull/4061), [`f880342`](https://github.com/kubb-labs/kubb/commit/f880342c1dc80611cd4094ced72c7d53e7d46cb5))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.5 — Sep 17, 2026

### @kubb/studio

#### Bug Fixes

- Stop holding a whole generation's output in memory for the life of a Studio session.
  
  `studio:files` and `studio:snapshot` used to read every generated file into one `Record<string,
  string>` the moment a run finished, and kept that map alive until the next generation. A run
  producing gigabytes of source meant the agent process held gigabytes in RAM, whether or not anyone
  ever opened a file or took a snapshot.
  
  The agent now keeps the live `Storage` a run wrote through, plus the list of paths it produced, and
  reads a file's content back from `Storage` only when `studio:files` or `studio:snapshot` actually
  asks for it. A path outside that list is refused before it reaches storage, so this changes nothing
  about what a session can read, only when the read happens. ([#4059](https://github.com/kubb-labs/kubb/pull/4059), [`351e3c9`](https://github.com/kubb-labs/kubb/commit/351e3c9f9822cfb7ffc5ac7d07517394a449f58e))
- Stop streaming generated source over the agent WebSocket by default. Reading it now needs
  `--allow-read` (or `KUBB_AGENT_ALLOW_READ=true`), matching the other four Studio permissions.
  
  Every `kubb studio` session used to send the full text of every generated file on
  `kubb:generation:end`, whether or not anyone in the browser opened one. A spec producing hundreds
  of files could put megabytes of source on the wire per run, and nothing gated it: `allowWrite`,
  `allowConfigEdit`, `allowInput`, and `allowExec` all cover what Studio may do _to_ a project, but
  reading generated output back was never one of the four.
  
  `kubb:generation:end` now carries nothing. Everything it used to carry moved somewhere better:
  
  - The list of generated files is on `kubb:build:end`, which already carried every path and fires
    earlier in a run. Its paths are now relative to the agent's root, matching every other path on
    the wire, where they used to be absolute.
  - The file count is on `kubb:generation:summary`, which already had it and was always the accurate
    number (`kubb:generation:end`'s old count went to 0 for a CI connection).
  - File contents are fetched on demand with a new `studio:files` command, which the browser sends
    when someone opens a file. The agent replies with `agent:files`, refusing unless `allowRead` was
    granted.
  - Peer dependency metadata, previously sent on every generation and round-tripped straight back
    into `studio:snapshot`, now travels with the `agent:snapshot` reply instead, since the CI
    snapshot flow is its only consumer. `studio:snapshot` takes `bundledDependencies` in place of
    `peerDependencies`.
  
  `--allow-read` is off by default everywhere, like every other permission. A sandbox or global
  agent is always granted it, since its output is the only thing it has:
  
  ```shell
  kubb studio --allow-read   # show generated files in the browser
  ```
  
  An older Studio instance talking to this version of the agent (or the reverse) can fail: a snapshot
  build errors because `bundledDependencies` and `peerDependencies` no longer line up between the two
  ends, and a plain session shows an empty editor with no file contents. Point `--url` at a Studio
  build that matches this version.
  
  The in-process `kubb:generation:end` hook (`kubb.hooks.hook('kubb:generation:end', ...)`, or a
  plugin's own listener) is unaffected. It still carries `config`, `storage`, `diagnostics`,
  `status`, `hrStart`, and `filesCreated`, exactly as before. Only the payload this event sends over
  the Studio WebSocket changed. ([#4059](https://github.com/kubb-labs/kubb/pull/4059), [`351e3c9`](https://github.com/kubb-labs/kubb/commit/351e3c9f9822cfb7ffc5ac7d07517394a449f58e))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.4 — Sep 16, 2026

### @kubb/studio

#### Bug Fixes

- Back off while polling a Studio job, so a long snapshot stops exhausting the API key rate limit.
  
  `waitForJob` polled `GET /api/jobs/{id}` every second, starting the instant the job was queued. The
  CLI's `kubb studio snapshot` waits up to 10 minutes by default, which is up to 600 requests against
  a budget of 100 per window. The window only resets after a whole window with no request, so a
  one-second poll could never escape the limit once it hit it, and every later call failed until the
  run gave up. The budget belongs to the organization key, so concurrent CI runs share it.
  
  The first poll now waits two seconds, since a job runs a generation and packs a tarball before it
  can possibly finish. From there the interval doubles to a 30 second ceiling, bringing a 10 minute
  wait down from 600 requests to 22. A 429 pushes the next poll out by the `tryAgainIn` Studio
  returns and never pulls it back in, and `retry: false` stops ofetch retrying a 429 with no delay. ([#4057](https://github.com/kubb-labs/kubb/pull/4057), [`52637b6`](https://github.com/kubb-labs/kubb/commit/52637b617207bd7e51e7f9d5c2220df9de0c4704))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.3 — Sep 16, 2026

### @kubb/studio

#### Bug Fixes

- The agent runtime now packs snapshot tarballs itself. A new `studio:snapshot` command builds the
  npm-installable tarball from the session's most recent generation and uploads it to a Studio
  endpoint, instead of Studio building the tarball on its own server. A snapshot request with no
  prior generation is refused.
  
  A CI connection also keeps generated files off every `kubb:generation:end` reply, since it has no
  UI to render them in. `kubb studio snapshot` and the Studio UI's "Create snapshot" button keep
  working as before, now backed by this protocol message. ([#4052](https://github.com/kubb-labs/kubb/pull/4052), [`19e9c2c`](https://github.com/kubb-labs/kubb/commit/19e9c2c70687f6440cd2d3e74d153edb64491d8d))
- The background reconnect loop's "Retrying connection" and "Reconnect attempt failed" lines, and
  the teardown notice `disconnect()` prints on the way out, now go through `console.error` instead
  of `console.info`/`console.log`, and only print when a host passes a `logLevel` above `silent` to
  `StudioSession`. Previously they always printed unconditionally, which a CI runner that only
  streams a child process's stderr live (such as `kubb-labs/action`) never surfaces, and which
  contradicted `installLogger`'s own "prints nothing when left out" default.
  
  `kubb studio` and `kubb studio snapshot` now pass their `--log-level` flag through, so these lines
  respect the same flag as the rest of the command's output. ([#4052](https://github.com/kubb-labs/kubb/pull/4052), [`19e9c2c`](https://github.com/kubb-labs/kubb/commit/19e9c2c70687f6440cd2d3e74d153edb64491d8d))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.2 — Sep 16, 2026

### @kubb/cli

#### Bug Fixes

- CLI flags are now kebab-case, matching the convention used by most command-line tools.
  
  - `kubb generate --log-level` and `kubb generate --dry-run` replace `--logLevel` and `--dryRun`.
  - `kubb studio --allow-write`, `--allow-config-edit`, `--allow-input`, and `--allow-exec` replace
    `--allowWrite`, `--allowConfigEdit`, `--allowInput`, and `--allowExec`.
  - `kubb init --dry-run` replaces `--dryRun`.
  
  To upgrade, replace any camelCase flag in a script or CI job with its kebab-case name. The CLI
  now rejects an unrecognized flag with an error instead of silently ignoring it.
  
  ```bash
  # Before
  kubb studio --allowWrite --allowExec
  
  # After
  kubb studio --allow-write --allow-exec
  ``` ([#4046](https://github.com/kubb-labs/kubb/pull/4046), [`e5ecdda`](https://github.com/kubb-labs/kubb/commit/e5ecdda06acbd3b99c2716384b2a8ac56eedfad8))

### @kubb/studio

#### Bug Fixes

- Renamed the `studio:ping` heartbeat reply to `studio:pong`, matching the ping/pong pattern
  `agent:ping` already implies (`StudioPingMessage` is now `StudioPongMessage`,
  `isStudioPingMessage` is now `isStudioPongMessage`). This is a wire-protocol change: an agent
  running an older `@kubb/studio` and a Studio running the new one won't recognize each other's
  heartbeat reply. Update both sides together.
  
  Also documented the full `studio:`/`agent:` message table in `packages/studio/src/protocol/index.ts`,
  including why `studio:generate` has no dedicated `agent:generate` reply (its result rides the
  `agent:data`/`kubb:generation:end` event stream instead, unlike `studio:save`/`studio:snapshot`,
  which reply directly). ([#4053](https://github.com/kubb-labs/kubb/pull/4053), [`76dd283`](https://github.com/kubb-labs/kubb/commit/76dd283169ac312c269c398bee64944eee6f5b05))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.1 — Sep 15, 2026

### @kubb/core

#### Bug Fixes

- Report duplicate barrel exports instead of emitting an invalid barrel. ([#4043](https://github.com/kubb-labs/kubb/pull/4043), [`2aad826`](https://github.com/kubb-labs/kubb/commit/2aad826b4f70cd7a82c30c8d6323c4fc7664848c))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.3.0 — Sep 15, 2026

### @kubb/core

#### Features

- Add an opt-in HTML report with generated files, plugin timings, and diagnostics. ([#4041](https://github.com/kubb-labs/kubb/pull/4041), [`be705de`](https://github.com/kubb-labs/kubb/commit/be705de4279b0fa691e1b1d5ef001ad515b4bafc))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.2.8 — Sep 15, 2026

### @kubb/cli

#### Bug Fixes

- Add `kubb studio snapshot` to generate and publish a Kubb Studio snapshot from any CI, not only GitHub Actions.
  
  - Registers or reuses a CI agent, connects it, queues a snapshot job, and polls until the tarball is ready.
  - Reads the organization CI API key from `--token` or `KUBB_TOKEN`.
  - Detects the calling CI (GitHub Actions, GitLab CI, Bitbucket Pipelines, CircleCI) to reuse one agent per pull or merge request, or takes an explicit `--id` on any other CI.
  - Prints a summary, or one JSON object with `--json` for a script to read.
  - `@kubb/studio` now also exports `createAgent` and `machineTokenFrom`, so a host can register a CI agent without hand-rolling the request.
  
  ```shell
  KUBB_TOKEN=$KUBB_TOKEN kubb studio snapshot --json
  ``` ([#4038](https://github.com/kubb-labs/kubb/pull/4038), [`4cd9f5e`](https://github.com/kubb-labs/kubb/commit/4cd9f5e311e5dc6edb14287c13db0a5466b4e892))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.2.7 — Sep 15, 2026

### @kubb/cli

#### Bug Fixes

- Create a separate Kubb Studio agent connection for each project directory while reusing the same agent within that directory. ([`af87dbc`](https://github.com/kubb-labs/kubb/commit/af87dbcc8bd77daabfa1ceb57f17366c83aab9d1))

### @kubb/studio

#### Bug Fixes

- Add `createJob` and `waitForJob` for Studio's async `/api/jobs` endpoints. ([#4035](https://github.com/kubb-labs/kubb/pull/4035), [`5382ff0`](https://github.com/kubb-labs/kubb/commit/5382ff06d685beb03f805e1a5dce4bba37aecb7d))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.2.6 — Sep 14, 2026

### @kubb/studio

#### Bug Fixes

- Add job ID correlation to Studio commands and streamed agent events. ([`0a1e553`](https://github.com/kubb-labs/kubb/commit/0a1e5537c5d1425af22081a04e51462e78baa947))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.2.5 — Sep 14, 2026

### @kubb/studio

#### Bug Fixes

- Add a `studio:ready` acknowledgement so a host can tell "the socket is open" apart from "Studio has registered this connection and will dispatch jobs to it".
  
  A connected socket announces itself with `agent:connect` but never waited for a reply, so a job could arrive at Studio moments before the agent was actually registered. `StudioSession` now waits up to 10 seconds for `studio:ready` after sending that handshake and fires a new `studio:ready` hook once it lands, warning instead of failing if an older Studio never sends one. `kubb studio` prints `✓ Ready to receive jobs` once it does. ([#4028](https://github.com/kubb-labs/kubb/pull/4028), [`b93eb64`](https://github.com/kubb-labs/kubb/commit/b93eb640264f2905cf9b47e73c5f3c957938240e))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.2.4 — Sep 14, 2026

### @kubb/studio

#### Bug Fixes

- Report the package a plugin ships from, so `plugin-ts` reaches Studio as `@kubb/plugin-ts` while a third-party plugin keeps its own name.
  
  The connect payload scoped every plugin name under `@kubb/`, which claimed a third-party plugin as one of Kubb's. It now follows the same rule the dependency check already used. ([#4026](https://github.com/kubb-labs/kubb/pull/4026), [`628c98b`](https://github.com/kubb-labs/kubb/commit/628c98b012cb9b1f91201c7c071fb66c4283f511))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.2.3 — Sep 13, 2026

### @kubb/cli

#### Bug Fixes

- `kubb generate --watch` now works with URL inputs. A remote document emits no filesystem events, so watch mode polls the URL (every 2 seconds) and regenerates when the response body changes. Each poll request times out after 10 seconds, so a hung server never stalls the watcher. An unreachable server is reported once per outage and polling continues. After recovery, a rebuild only happens when the document actually changed, unless the server was already down at startup, in which case the first successful poll regenerates so the output catches up. Previously `--watch` was silently ignored for URL inputs and the CLI exited after a single build. ([#4022](https://github.com/kubb-labs/kubb/pull/4022), [`5f4fd20`](https://github.com/kubb-labs/kubb/commit/5f4fd2006e828838d221e46588440aaf6705bd38))

### @kubb/studio

#### Bug Fixes

- Report installed peer dependency versions and missing dependencies with each generation result. ([#4021](https://github.com/kubb-labs/kubb/pull/4021), [`6187109`](https://github.com/kubb-labs/kubb/commit/6187109c97bd00d4cf17234b7383a43e84d4b71e))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle), [@tachirodriguez](https://github.com/tachirodriguez)

## v5.2.2 — Sep 11, 2026

### @kubb/adapter-oas

#### Bug Fixes

- A `oneOf`/`anyOf` without a declared OpenAPI `discriminator` now infers one when a property
  carries a distinct single literal value on every branch. `UnionSchemaNode.discriminatorPropertyName`
  is set from that inference, so every printer that narrows on it (`plugin-zod`, `plugin-faker`)
  picks it up without reimplementing the same scan. ([#4019](https://github.com/kubb-labs/kubb/pull/4019), [`c89f215`](https://github.com/kubb-labs/kubb/commit/c89f215e942a8b21294f7f35d83040cf10db951c))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.2.1 — Sep 10, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Keep a binary response body under `application/octet-stream` typed as a blob instead of falling
  back to `emptySchemaType`. ([#4013](https://github.com/kubb-labs/kubb/pull/4013), [`dd9a902`](https://github.com/kubb-labs/kubb/commit/dd9a902b310b14be77560c79b131f2f08e182727))

### @kubb/core

#### Bug Fixes

- Add a `kubb.dev/sponsors` entry to each published package's `funding` field, alongside the
  existing GitHub Sponsors and Open Collective links. ([#4007](https://github.com/kubb-labs/kubb/pull/4007), [`b063738`](https://github.com/kubb-labs/kubb/commit/b06373881532b71c9316600eaf40f096484fdb51))

### @kubb/studio

#### Bug Fixes

- Trim `@kubb/studio`'s public API to what the `kubb studio` CLI command and the Docker agent
  actually use.
  
  - Removed the unused hook context types `StudioCommandStartContext`, `StudioCommandEndContext`,
    `StudioConnectingContext`, `StudioDisconnectedContext`, `StudioErrorContext`, and
    `StudioWarnContext` from the package's root export. `StudioConnectedContext` stays exported.
    Hook payloads for `studio:connecting`, `studio:command:start`, `studio:command:end`,
    `studio:disconnected`, `studio:warn`, and `studio:error` still type-check through
    `Hookable<KubbHooks>['hook']`, since the underlying types are still declared, just no longer
    importable by name.
  - Removed `ConnectionOutcome` and `TokenRejection` from the root export. Both stay inferable from
    `runConnection`'s return value and `onTokenRejected` callback.
  
  Neither the CLI nor the Docker agent imports any of these by name, so this does not change their
  behavior. A consumer that did import one of them by name gets the same type through inference at
  the call site instead, such as `runConnection`'s return value or a `hooks.hook('studio:warn', ...)`
  callback's parameter. ([#4012](https://github.com/kubb-labs/kubb/pull/4012), [`109abe8`](https://github.com/kubb-labs/kubb/commit/109abe8a05d43cca35e93571456de882acff61e6))

### Contributors

Thanks to everyone who contributed to this release:

[@ghettoDdOS](https://github.com/ghettoDdOS), [@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.2.0 — Sep 9, 2026

### @kubb/adapter-oas

#### Bug Fixes

- [`5ccc52c`](https://github.com/kubb-labs/kubb/commit/5ccc52cad88cc7aa6943c96105f0ec6d6b2d4106) - Bump `@readme/openapi-parser` to v8. Spec validation behavior is unchanged. ([`5ccc52c`](https://github.com/kubb-labs/kubb/commit/5ccc52cad88cc7aa6943c96105f0ec6d6b2d4106))

### @kubb/ast

#### Features

- Add utilities for resolving object properties through references and intersections and for reading
  literal values from enum schemas. Plugin authors can use these utilities to handle discriminated
  unions without implementing their own schema traversal. ([#3989](https://github.com/kubb-labs/kubb/pull/3989), [`a2b5924`](https://github.com/kubb-labs/kubb/commit/a2b59246e2d26b04da4e0152f92423994f37623c))

### @kubb/cli

#### Bug Fixes

- `kubb init` and `kubb generate --watch` now print plain lines when the terminal cannot carry
  clack's gutter, such as a piped run or CI. They wrote box-drawing and cursor escapes into the
  output before. Spinner steps print as lines there instead of disappearing with the animation. ([#3983](https://github.com/kubb-labs/kubb/pull/3983), [`d1b123e`](https://github.com/kubb-labs/kubb/commit/d1b123e68c62cd7aac146aaa2079badfd1c4a234))
- `kubb mcp` and `kubb validate` now load `@kubb/mcp` and `@kubb/adapter-oas` only when their
  commands run. Every other command, including `kubb --help`, no longer touches either optional peer. ([#3968](https://github.com/kubb-labs/kubb/pull/3968), [`0e4dc40`](https://github.com/kubb-labs/kubb/commit/0e4dc4073c10ae53d98b5619cd2b4fa9e2622d9f))

### @kubb/core

#### Bug Fixes

- Moved shared-utility logic used by only one package out of `@internals/utils` and into that
  package (`@kubb/core`, `@kubb/cli`, `@kubb/kit`). No public API or behavior changed. ([#3968](https://github.com/kubb-labs/kubb/pull/3968), [`0e4dc40`](https://github.com/kubb-labs/kubb/commit/0e4dc4073c10ae53d98b5619cd2b4fa9e2622d9f))

### @kubb/studio

#### Features

- Add the Kubb Studio CLI for connecting a local Kubb project to Kubb Studio. ([#3972](https://github.com/kubb-labs/kubb/pull/3972), [`0cd4c7b`](https://github.com/kubb-labs/kubb/commit/0cd4c7b5033833f9a0db2935fc25a575daecf058))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.1.0 — Sep 3, 2026

### @kubb/adapter-oas

#### Features

- Let `dateType` set `date-time`, `date`, and `time` independently, instead of one value driving all three
  
  Pass an object to represent timestamps as a JS `Date` while keeping date-only and time-only fields as strings, since `Date` cannot round-trip those without inventing a timezone.
  
  ```ts
  adapterOas({
    dateType: {
      dateTime: 'date',
      date: 'string',
      time: 'string',
    },
  })
  ```
  
  The scalar form (`dateType: 'date'`) still applies one value to all three formats. ([#3957](https://github.com/kubb-labs/kubb/pull/3957), [`9fca8e9`](https://github.com/kubb-labs/kubb/commit/9fca8e9ba16f05f29c852123c8696f7b6036c4a9))

#### Bug Fixes

- Explicit `types` fields for each package.json `exports` entry, so that it works with tsconfig.json `moduleResolution: 'bundler'` ([#3964](https://github.com/kubb-labs/kubb/pull/3964), [`be4cd17`](https://github.com/kubb-labs/kubb/commit/be4cd1770a34f547d1f1f60bd165c4228fef5053))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.6 — Sep 2, 2026

### @kubb/cli

#### Bug Fixes

- Adds `--dryRun` to `generate` and `init` to preview a run without writing files, installing packages, formatting, linting, or running post-generate commands. When an AI coding agent runs the CLI, `generate` now uses the plain logger instead of the interactive one, and anonymous telemetry records the agent's name. ([#3951](https://github.com/kubb-labs/kubb/pull/3951), [`9849de3`](https://github.com/kubb-labs/kubb/commit/9849de3387ccfdb4e29c92e42e1e0429f3325c83))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.5 — Aug 31, 2026

### @kubb/core

#### Bug Fixes

- [`2869e6d`](https://github.com/kubb-labs/kubb/commit/2869e6d390265835436e9bd5702852f7c8bb8209) - Avoids duplicate filesystem reads during generated file writes and uses native Node.js promise timers in asynchronous tests. ([`2869e6d`](https://github.com/kubb-labs/kubb/commit/2869e6d390265835436e9bd5702852f7c8bb8209))

## v5.0.4 — Aug 28, 2026

### unplugin-kubb

#### Bug Fixes

- Move `unplugin-kubb` past its squatted npm version range.

  Versions 5.0.1 through 5.0.30 were already published on npm from `unplugin-kubb`'s
  pre-monorepo history and depend on kubb v4, so the package's version was set directly to
  5.0.31 to clear that range. This changeset picks up from that 5.0.31 baseline and puts
  `unplugin-kubb` back through the normal release process, independent of `kubb` and `@kubb/*`. ([#3940](https://github.com/kubb-labs/kubb/pull/3940), [`b45071e`](https://github.com/kubb-labs/kubb/commit/b45071e996d6607c62eaa31c88cc47ab2b5243c5))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.3 — Aug 27, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Keep every discriminator mapping key that targets the same schema, and apply the discriminant to children declared with `allOf` ([#3929](https://github.com/kubb-labs/kubb/pull/3929), [`58d9625`](https://github.com/kubb-labs/kubb/commit/58d96255713042eadefe352103aa517661025297))

### Contributors

Thanks to everyone who contributed to this release:

[@xeoneux](https://github.com/xeoneux)

## v5.0.2 — Aug 24, 2026

### @kubb/kit

#### Bug Fixes

- Fix `Url.toPath` producing route masks that `path-to-regexp` (used by MSW/Express) rejects or misparses:
  
  - A parameter name starting with a character outside `[A-Za-z0-9_]` (e.g. `{$id}`) now sanitizes to a safe capture name instead of keeping the disallowed character.
  - Distinct parameter names that normalize to the same identifier (e.g. `{group-id}` and `{group.id}`) are now deduplicated with an incrementing suffix (`groupId`, `groupId2`) instead of producing two identically named captures. ([#3922](https://github.com/kubb-labs/kubb/pull/3922), [`56a072c`](https://github.com/kubb-labs/kubb/commit/56a072c036e2b5d44fb8ac278ebd0800c583975a))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.1 — Aug 21, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Fix an OpenAPI 3.1 multi-type array collapsing to one type when paired with `format`. `type: ["null", "integer", "string"], format: "int32"` generated `integer | null`, dropping `string`. The multi-type rule now runs before `format`, so each type parses on its own. ([#3916](https://github.com/kubb-labs/kubb/pull/3916), [`3d0098c`](https://github.com/kubb-labs/kubb/commit/3d0098c51be704557f735ec09d50a43218f808dc))
- Fix an OpenAPI 3.1 multi-type array dropping its other types when `null` came first. `type: ["null", "string"]` generated `null` instead of `string | null`, while `type: ["string", "null"]` generated the right type, so the output depended on the order the types happened to be written in. The normalized type now takes the first non-`null` entry, and `type: ["null"]` stays a null schema. ([#3912](https://github.com/kubb-labs/kubb/pull/3912), [`331558e`](https://github.com/kubb-labs/kubb/commit/331558ef615cdd1b6a4701c3c67176ed46370771))

### @kubb/cli

#### Bug Fixes

- Bump `verkit` to 0.4.0 and `@tmcp/transport-stdio` to 0.5.0. ([#3909](https://github.com/kubb-labs/kubb/pull/3909), [`77e95a7`](https://github.com/kubb-labs/kubb/commit/77e95a7ca0ee8c2e9bec5be474205e97bce0a54b))

### @kubb/kit

#### Bug Fixes

- Fix `Url.toPath` producing an invalid Express-style route for a hyphenated path parameter (e.g. `{point-id}` became `:point-id`). `path-to-regexp` treats a hyphen as ending the parameter name, so the generated MSW handler matched `:point` followed by a literal `-id` and rejected valid values. `Url.toPath` now camelCases the parameter name the same way `Url.toTemplateString` already does, so `{point-id}` becomes `:pointId`. ([#3895](https://github.com/kubb-labs/kubb/pull/3895), [`bf9bdc8`](https://github.com/kubb-labs/kubb/commit/bf9bdc823a2fe06225d2a01b93caa618372e6c6b))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0

Kubb v5 rebuilds code generation around adapters, a universal AST, parsers, and storage, and generates code up to 5.4x faster than v4. Config gets shorter, generated client calls change shape, and plugins move to their own repo ([kubb-labs/plugins](https://github.com/kubb-labs/plugins)).

Read the [release blog post](https://kubb.dev/blog/v5) for the highlights, and the [migration guide](https://kubb.dev/docs/5.x/how-to/migration) for the full, per-package breaking-change list and upgrade steps.

For prior releases, see [GitHub Releases](https://github.com/kubb-labs/kubb/releases).
