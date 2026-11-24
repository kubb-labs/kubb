# Tech Debt Audit: kubb

Generated: 2026-11-24, from `main` at `1d2fa72`. Method: [tech-debt-audit](https://github.com/ksimback/tech-debt-skill). The audit was read-only: no source files changed. The findings marked "probe" were reproduced with throwaway tests run outside the repo.

## Executive summary

- **Totals:** 66 findings: 0 Critical, 14 High, 26 Medium, 26 Low.
- **Untrusted input is the main problem.** Studio, MCP and remote `$ref`s all feed specs and arguments into the build, and the build trusts them more than it should. Most High findings are here, in `adapter-oas/src/load/*`, `mcp/src/tools/*`, `internals/shared/src/init.ts` and `studio/src/connect.ts`.
- **Code injection into `kubb.config.ts` (F001).** `generateConfigFile` writes paths into the file without escaping. An MCP `init` argument containing `'` becomes code that runs on the next `kubb generate`. The fix is one line.
- **Telemetry sends plugin option values, on by default (F002).** The payload can include URLs, paths and values read from the environment. The CLI notice and code comments say no personal data or secrets are sent.
- **Remote `$ref`s are fetched with no host policy, no timeout and no abort signal (F004, F005).** This applies even in Studio sandbox mode. YAML anchors can crash the parser or make it run for a very long time (F006, F007).
- **Errors from the build are hidden or mislabeled.** `Diagnostics.dedupe` drops distinct warnings (F010). `resolveNode` turns any crash into a `null` schema (F008). An error in a plugin's bus hook becomes `KUBB_UNKNOWN` with no plugin name (F011).
- **Plugin listeners leak.** When `setup()` fails, or `setup()` runs twice, listeners stay on the shared `Hookable`. With several configs, the next config runs the previous config's hooks (F012, F013).
- **Deprecated APIs are still the code that runs in production.** renderer-jsx still writes per-source `inline`, `isTypeOnly` and `isIndexable`. The `@kubb/ast` "compatibility" paths are what actually run (F021–F023). Spreading an import node and changing `names` silently does nothing (F003, probe).
- **Test coverage leans on deprecated APIs.** Most `combineFileMembers` and kit visitor tests build nodes and generators with the deprecated API. Removing it in v6 would delete that coverage (F041, F042).
- **Audit tooling:** `pnpm audit` reports 10 advisories, all in dev dependencies. `pnpm audit --prod` reports none. `knip` and `madge` were not run, because downloading them was not permitted.

## Architectural mental model

Kubb is a pnpm and Turborepo monorepo of about 38k lines of TypeScript source. It is a pipeline: **config → adapter → AST → plugins → files → parser → storage**.

- `internals/shared` loads `kubb.config.ts` through jiti and edits it through the yuku AST.
- `@kubb/adapter-oas` reads an OpenAPI or Swagger document from a file, a URL, git or raw data. It bundles `$ref`s, upgrades the document to 3.1, validates it in a worker, and converts it to `@kubb/ast` nodes.
- `@kubb/core` (`createKubb` → `KubbDriver`) orders plugins, runs each plugin's AST visitors and bus hooks on one shared `Hookable`, and collects `FileNode`s in `FileManager`. It then empties the clean paths and writes files through a `Storage` after a parser (`parser-ts`, `parser-md`) prints them.
- `@kubb/kit` is the plugin-authoring layer. It provides `defineExtension`, templates and composables, and turns templates into visitors. `renderer-jsx` turns JSX into `FileNode`s. `plugin-barrel` writes index files at `kubb:plugins:end`.
- The CLI wraps all of this for local use. `@kubb/studio` is a WebSocket RPC agent (capnweb) that lets the hosted Studio run generations, read files, and edit config on a developer machine or in a sandbox. `@kubb/mcp` exposes `init`, `generate` and `validate` to AI assistants.

The architecture matches the README and AGENTS.md, with two gaps:

- The packages are described as ESM-only, but core, kit, renderer-jsx, plugin-barrel and shared all ship CJS builds.
- The move from generators to templates (#4741) is about half done. New names sit beside old ones, and the in-repo renderer still emits the deprecated fields.

Churn is concentrated in `packages/kit/src/*` and `packages/core/src/KubbDriver.ts`. The largest files are `studio/src/connect.ts` (1120 lines) and `internals/shared/src/configFile/configFile.ts` (906 lines).

## Findings

| ID | Category | File:Line | Severity | Effort | Description | Recommendation |
|----|----------|-----------|----------|--------|-------------|----------------|
| F001 | Security | internals/shared/src/init.ts:6 | High | S | `generateConfigFile` writes `inputPath` and `outputPath` raw inside `'...'`. Untrusted input reaches it from MCP `init` (packages/mcp/src/tools/init.ts:26, arguments chosen by an LLM) and from CLI `--input`/`--output` (packages/cli/src/runners/init/run.ts:77,169). A value containing `'` injects code that jiti runs on the next `kubb generate`. A Windows path `C:\new\x` is also corrupted. | Use `printValue(value, quotes.single)` from configFile/text.ts:25, or `JSON.stringify`. Add a test with `'` and `\`. |
| F002 | Security / Doc drift | packages/cli/src/Telemetry.ts:109 | High | S | The `kubb.plugin_options` payload is the `JSON.stringify` of every option value: `baseURL`, `output.path`, banners, and anything read from `process.env`. The comments at Telemetry.ts:24 and :195 and the notice at packages/cli/src/index.ts:53 say this cannot happen. | Send the option shape (keys and value types) or an allowlist of enum and boolean options. Fix the claims. |
| F003 | Contract | packages/ast/src/nodes/file.ts:332 | High | S | `createImport({ ...imp, names: next })` discards `next`. The spread carries the old derived `name`, and `isOverride` treats it as a user override. Probe result: `{ names: null, name: ['Pet'] }`. | Record which fields were derived (for example under a symbol key that survives spread), so a stale copy is not taken for an override. Add tests. |
| F004 | Security | packages/adapter-oas/src/load/source.ts:39-41 | High | M | Remote `$ref`s are fetched from any host, including loopback and `169.254.169.254`, and redirects are followed. This happens even when `fileRefs: []` marks a sandboxed Studio agent (studio/src/resolveConfig.ts:362). The parse error at source.ts:141 quotes part of the response body back to the caller. | When `fileRefs` is set, refuse private, loopback and link-local hosts and use `redirect: 'error'`. Drop the code frame for remote sources. |
| F005 | Resource hygiene | packages/adapter-oas/src/load/source.ts:41 | High | S | `fetch(url)` has no timeout, no size cap and no abort signal. `parse({ signal })` (adapter.ts:376) never passes the signal down. One slow URL hangs the build, and Studio's cancel cannot stop it. | Thread the signal through `parseFromConfig` → `bundleDocument` → `resolveSource`, and combine it with `AbortSignal.timeout`. |
| F006 | Error handling / DoS | packages/adapter-oas/src/load/schemaIds.ts:222-236 | High | S | A recursive YAML anchor (`x-loop: &a [*a]`) creates a cyclic object. The walk then throws an uncoded `RangeError` stack overflow (probe). normalize.ts:35-50 has the same problem. | Keep a `WeakSet` of visited objects in `scanDocument`, `walk` and `inlinePathRefs`. Report a cycle as `invalidDocument`. |
| F007 | Performance / DoS | packages/adapter-oas/src/load/source.ts:126-127 | High | S | js-yaml has no alias limit. A 1 KB file with 26 nested alias levels takes 22.8 s (probe), and the time doubles with each extra level. | Count alias events and throw `invalidDocument` above a cap. F006's visited set also stops the repeated walks. |
| F008 | Error handling | packages/adapter-oas/src/refs.ts:85-102 | High | S | `resolveNode` catches every error from `parse()`, including converter bugs, and returns `null`. `null` also means "circular". `resolvingRefs.delete` is not in a `finally`. | Use `try/finally`. Catch only the missing-ref case. |
| F009 | Security | packages/mcp/src/tools/generate.ts:95 | High | S | The tool checks the `config` path (`isPathInside` at :66) but not `output` or `input`. With `output.clean: true` (the `kubb init` default), `output: '../other-repo/src'` gets emptied. `input` can read any local file. | Resolve `output` and a non-URL `input` against `base` and require `isPathInside`. |
| F010 | Error handling | packages/core/src/Diagnostics.ts:448 | High | S | The `dedupe` key is `code + pointer + plugin`, without the message. A plugin's second warning that has no location is dropped. A crash diagnostic is dropped after an earlier location-less `ctx.error`. KubbDriver.ts:480 already works around this. | Add the message to the key. Add a test with two location-less warnings. |
| F011 | Error handling | packages/core/src/KubbDriver.ts:306-317 | High | S | A throw in a plugin's `kubb:build:start`, `plugins:end`, `plugin:end` or `build:end` becomes `KUBB_UNKNOWN`, with no plugin and `failedPlugins = 0`, and the write is skipped. A `kubb:plugin:start` listener that throws marks the wrong plugin as failed. | In the bus-hook wrapper, rethrow `Diagnostics.fromExtension(err, { kind: 'plugin', extension: plugin })`. |
| F012 | Resource hygiene | packages/core/src/KubbDriver.ts:207-214 | High | S | Listeners are registered before `inputToAdapterSource`, which can throw. `#driver` is never set (createKubb.ts:216), so `dispose()` never runs. In `Kubb.generate`, the next config runs the previous config's hooks. | Resolve the adapter source first. Dispose the driver if `setup()` fails. |
| F013 | Resource hygiene | packages/core/src/createKubb.ts:183,279 | Medium | S | Calling `kubb.setup()` and then `generate()` creates two drivers. The first driver's listeners are never removed, so barrels run twice. | Call `this.#driver?.dispose()` at the start of `setup()`, or skip setup when a driver already exists. |
| F014 | Security / shell | internals/utils/src/openInBrowser.ts:14 | High | S | `cmd /c start "" <url>` treats `&` in the server-supplied `verification_uri_complete` (cli/src/runners/studio/run.ts:142) as a command separator. On other platforms any scheme is opened. | Allow only `http(s):` URLs. On Windows, use `rundll32 url.dll,FileProtocolHandler`. |
| F015 | Security | packages/studio/src/connect.ts:449,559,629 | Medium | S | `#sandbox` and `#managed` are re-read after awaits, and `connect()` can overwrite `info` while a generation runs. A mid-run switch from managed to not-managed keeps a Studio-sent URL spec and skips `withPublicFetch`. | Read the mode once at the start of `#runGeneration`, or refuse `connect()` while a generation is active. |
| F016 | Security / Contract | packages/studio/src/connect.ts:190,594 | Medium | S | The docs say Studio's flags "only take permissions away". In fact `managed: true` sent by Studio unlocks a Studio-sent URL or git spec, a git checkout, and a write on a `user`/`cli` agent. | Honor `managed` only when the host's `agentType` is `managed`, or fix the docs. |
| F017 | Contract | packages/studio/src/connect.ts:522,637 | Medium | S | `jobId` is never type-checked. A non-string `jobId` runs the whole generation, writing files when `allowWrite` is on, and only then throws in `hashOf`. | Check the type before line 522. |
| F018 | Contract | packages/studio/src/resolveConfig.ts:167,254,387 | Medium | S | The shape of the plugin, adapter and parser payloads from Studio is never checked. A string `adapter` merges character indices. Options for Studio-only plugins skip the `isSafeKey` filter. | Assert plain objects and arrays at the start of `#generate`. Pass the options through `mergeOptions`. |
| F019 | Security | packages/studio/src/connect.ts:564 | Medium | S | A managed generation accepts a non-http `url` kind such as `C:\spec.yaml`. adapter-oas reads it from disk (source.ts:76). The rule at line 731 refuses this, but line 564 does not apply it. | Share the line-731 check. |
| F020 | Security / Resource | packages/studio/src/publicFetch.ts:121-129 | Medium | S | `withPublicFetch` replaces the global `fetch` for the whole generation. It is not reentrant, and it breaks unrelated requests made during the window, such as the CLI token refresh. | Pass a `fetch` down to `fetchSource`. At minimum, add a refcount. |
| F021 | Deprecated field | packages/ast/src/utils/inline.ts:135 | Medium | M | #4728 moved `inline` to the File, but `isInlineFile` and `bodyOf` still read the per-source field, which renderer-jsx writes (jsxRenderer.ts:140,180). The path marked "removed in v6" is the one production uses. | Make renderer-jsx set `inline` on the File. Keep the per-source read only as a fallback. |
| F022 | Consistency | packages/ast/src/utils/combineFileMembers.ts:113 | Medium | S | `combineSources` reads `export ?? isExportable`, while plugin-barrel (utils.ts:118) and renderer-jsx (File.tsx:80) read `export ?? isIndexable`. The same source can be exported in one place and not in another (probe). | Add one `isExported(source)` helper and use it at all three sites. |
| F023 | Deprecated field | packages/ast/src/utils/moduleNames.ts:14 | Low | S | renderer-jsx always writes `isTypeOnly: !!x` (jsxRenderer.ts:137,149), so the type-only inference in `getSpace` never runs for JSX output. | Write `space`, or treat `false` as unset. |
| F024 | Correctness | packages/parser-ts/src/utils.ts:422 | Medium | S | A namespace alias that starts with a digit has that digit replaced by `_`. `1pets` and `2pets` both print as `export * as _pets`, which is a TS error (probe). | Add `_` as a prefix instead of replacing the digit. |
| F025 | Correctness | packages/adapter-oas/src/emit/converters/composition.ts:321 | Medium | S | #4758 adds `null` to a sibling enum for every 2.0 or 3.0 document, including schemas that are not nullable. | Also require `context.nullable`. Add a test with a non-nullable 3.0 schema. |
| F026 | Correctness | packages/adapter-oas/src/operation.ts:75-82 | Medium | S | The fallback operationId slugifies the path, so `/a-b` and `/a/b` collide. Duplicate ids, generated or declared, are never detected. | Check uniqueness, report a diagnostic, and add a suffix. |
| F027 | Contract | packages/adapter-oas/src/refs.ts:47-48 | Medium | S | `decodeURIComponent` throws on `100%` (probe). The pointer walk reads through the prototype chain, so `#/.../constructor` resolves to `Function` (probe). | Wrap the decode. Use `Object.hasOwn` in the walk. |
| F028 | Security | packages/adapter-oas/src/adapter.ts:357-361 | Medium | S | `validate()` never passes `fileRefs`. The MCP `validate` tool (mcp/src/tools/validate.ts:20) can therefore read any local file through a `$ref`. | Forward `fileRefs`, and set it to the project root from MCP. |
| F029 | Correctness | packages/adapter-oas/src/adapter.ts:367-371 | Medium | S | A cache hit restores `sources` but not `parsedDocument`, so `adapter.document` shows a different spec. | Cache the document with the sources. |
| F030 | Resource hygiene | packages/core/src/FileManager.ts:349-369 | Medium | S | `inParallel` rejects on the first error, but the other workers keep writing after the build has reported failure. This can overlap the next config's `storage.empty`. | Abort a local controller on the first failure. |
| F031 | Consistency | packages/core/src/FileManager.ts:373-378 | Medium | S | The shared-file mismatch warning is emitted live, with no code. It is not in `BuildOutput.diagnostics` and `diagnostics.ignore` cannot hide it. | Use `Diagnostics.report` with a catalog code. |
| F032 | Doc drift / data safety | packages/core/src/createKubb.ts:206-207 | Medium | S | The comment says a failed run "leaves the previous output in place". In fact the clean paths are emptied (KubbDriver.ts:444) before parsing, so a parser crash wipes the old output. | Fix the comment. Deciding whether to parse before emptying is the maintainer's call. |
| F033 | Contract | packages/core/src/createKubb.ts:37-39 | Medium | S | Checking `storage.name === 'fs'` means a wrapped or custom disk storage silently skips format, lint, `postGenerate` and the manifest. | Add a `writesToDisk` capability, or warn when those steps are skipped. |
| F034 | Error handling | packages/cli/src/Telemetry.ts:53 | Medium | S | The payload is built synchronously, outside the `try`. A BigInt or a cycle in the options throws inside `kubb:generation:end` and fails a generation that succeeded. | Build the payload inside the existing try/catch. |
| F035 | Consistency | packages/cli/src/runners/init/run.ts:350 | Medium | S | `init` and `studio` (studio/run.ts:572) print only `error.message`, so the `help` text of `Diagnostics.Error` is lost. | Render with `Diagnostics.format(Diagnostics.from(error))`. |
| F036 | God file | packages/studio/src/connect.ts:1 | Medium | M | 1120 lines: transport, reconnect loop, a 590-line `Agent`, extension subprocesses, config views and staging. | Move the extension commands to `extensions.ts` and the views to `configView.ts`. |
| F037 | God file | internals/shared/src/configFile/configFile.ts:112 | Medium | M | 906 lines that mix discovery, the read view, option edits and plugin enable and disable. The section comments already mark where to split. | Split into `find.ts`, `read.ts` and `edit.ts` along those sections. |
| F038 | God function | packages/cli/src/runners/studio/run.ts:340 | Medium | M | `connect()` runs about 170 lines with seven pieces of mutable state. | Move the token refresher and the permissions into their own modules. |
| F039 | Duplication | packages/cli/src/runners/studio/run.ts:206 | Medium | S | The permission set is listed by hand in 5 places, and only one of them is typed as `Record<AgentPermission, …>`. | Derive the others from that typed record. |
| F040 | Resource hygiene | packages/studio/src/connect.ts:973-981 | Medium | S | The heartbeat starts only after `connect()`. A socket that opens but is never connected waits forever. | Start a connect deadline as soon as the socket opens. |
| F041 | Test debt | packages/ast/src/utils/combineFileMembers.test.ts:34 | Medium | M | 27 nodes are built with the deprecated `name`/`isTypeOnly` and only 2 with `names`. parserTs.test.ts has 16 against 6. | Rewrite the fixtures to `names`, and keep one small test for the deprecated input. |
| F042 | Test debt | packages/kit/src/visitor.test.ts:116 | Medium | M | 31 `addGenerator(` calls against 5 `addTemplate(`. The direct template path is thinly covered. | Move the tests to `defineTemplate` and `addTemplate`. |
| F043 | Test debt | packages/adapter-oas/src/operation.ts:1 | Medium | M | 558 lines with no unit tests for the parameter merge, `spreadQuerystring`, `camelCasePathParams` or the operationId fallback. | Add a table-driven `operation.test.ts`. |
| F044 | Test debt | packages/adapter-oas/src/emit/converters/composition.ts:1 | Medium | M | Four fixes in recent PRs (#4734 to #4758), but only a 113-line test file. The regression cases sit in the 3583-line parser.test.ts. | Put the regression cases next to the code they cover. |
| F045 | Test debt | packages/ast/src/nodes/file.ts:317 | Medium | S | The `isOverride` heuristic, which Schema.tsx:28 depends on, has two tests, and neither changes `names`. | Add test cases (see F003). |
| F046 | Deprecated APIs | packages/kit/src/defineExtension.ts:21-28 | Medium | S | The `addGenerator` and `setMacros` properties on `KitSetupContext` have no `@deprecated` tag, so `kubb.setMacros()` shows no strikethrough. | Tag the properties. |
| F047 | Naming drift | packages/kit/src/visitor.ts:93 | Medium | S | `generatorVisitor` and `GeneratorContext` are the real names, and `TemplateContext` is only an alias of the second. | Make `TemplateContext` the real type and deprecate `GeneratorContext`. |
| F048 | Doc drift | packages/renderer-jsx/src/jsxRenderer.ts:220 | Medium | S | The JSDoc example uses the deprecated `defineGenerator`. JSX is already the default renderer. core/createRenderer.ts:42 has the same stale reference. | Rewrite the example with `defineTemplate`. |
| F049 | Dependency | packages/parser-md/package.json:72 | Medium | S | `@kubb/core` and `@kubb/ast` are hard `dependencies` here, while parser-ts has them as peers. With exact pinning (#4753), this can install a second copy of core. | Make them peer dependencies, as in parser-ts. |
| F050 | Consistency | packages/studio/src/resolveConfig.ts:30 | Medium | S | `importFromProject` falls back to `process.cwd()`, while extensions are found from `options.root`. | Pass `root` through. |
| F051 | Error handling | packages/studio/src/connect.ts:684-709 | Medium | S | `saveConfig` writes the config before the documents. If a document write fails, every edit is reported as not applied, while the config already points at the missing file. | Write the documents first. |
| F052 | Security hygiene | packages/studio/src/connect.ts:417 | Low | S | A Studio user's display name (`requestedBy`) is printed raw in another member's terminal, which allows terminal escape injection. | Use `stripVTControlCharacters` and a length cap. |
| F053 | Security hygiene | packages/studio/src/pair.ts:349-358 | Low | S | The token refresh follows redirects and resends `machine_id`. snapshot.ts:269 already uses `redirect: 'error'`. | Add `redirect: 'error'` here and to the pairing POSTs. |
| F054 | Security hygiene | packages/cli/src/runners/studio/worker.ts:9 | Low | S | The redaction list is fixed at start-up, so tokens issued by a later refresh or re-pair are not redacted. `privateKey` is never redacted. | Redact from a getter over the current credentials. |
| F055 | Security hygiene | packages/studio/src/generationEvents.ts:76 | Low | S | `error.stack` is sent to Studio, including from shared sandbox agents. | Drop the stack outside debug mode. |
| F056 | Security hygiene | packages/cli/src/utils/registry.ts:15 | Low | S | `KUBB_REGISTRY` accepts plain `http://` for any host, and the registry decides which packages get installed. | Reuse the https-or-loopback rule from studio/src/url.ts:25. |
| F057 | Security hygiene | packages/core/src/FileManager.ts:128-133 | Low | S | There is no check that written files stay inside the output folder. The clean guard (createKubb.ts:193) refuses only the root and its ancestors. | Warn on, or refuse, paths outside `output.path` and `shared.path` using `isPathInside`. |
| F058 | Consistency | internals/utils/src/fs.ts:211-220 | Low | S | `isPathInside` rejects a child named `..cache`, so plugin-barrel throws a false `KUBB_PATH_TRAVERSAL`. Studio has 4 more copies of this check (connect.ts:286,732; generations.ts:131,194). | Check `rel === '..' \|\| rel.startsWith('..' + sep)` and use the helper everywhere. |
| F059 | Duplication | packages/ast/src/utils/combineFileMembers.ts:62 | Low | S | The relative specifier is computed and memoized twice: here and in parser-ts/src/utils.ts:87. | Export one helper from `@kubb/ast`. |
| F060 | Duplication | packages/adapter-oas/src/emit/converters/composition.ts:32-42 | Low | M | The alias-chain walk with a cycle guard is written by hand at 5 or more sites (preserve.ts:43,178; mediaType.ts:40,96,112). | Add `refs.derefChain`. |
| F061 | Duplication | internals/shared/src/configFile/rules.ts:58-59 | Low | S | The format and lint lists repeat the tool tables in utils/src/tools.ts:16,37. | Build the lists from `Object.keys`. |
| F062 | Config drift | packages/parser-ts/src/parserTsx.ts:30 | Low | S | The `parserTsx` meta has no `version` or `compatibility`, so the compatibility check does nothing for it. | Copy the meta fields from parserTs. |
| F063 | Correctness | packages/kit/src/file.ts:104 | Low | S | The `schemaPaths` memo key leaves out `group.name`. | Key a WeakMap on the `output` and `group` objects instead. |
| F064 | Deprecation hygiene | packages/kit/src/deprecated.ts:5-25 | Low | S | Removal targets are mixed: "v6", "next major", or none. The same mix appears in core (definePlugin.ts:419 against KubbDriver.ts:726). | Use "Removed in Kubb v6" everywhere and list the removals in one place. |
| F065 | Doc drift | internals/shared/src/constants.ts:10-12 | Low | S | The comment cites `constants.test.ts`, which does not exist, so `BUNDLED_PACKAGES` is never checked. | Add the test. |
| F066 | Dev tooling | turbo.json:35 | Low | S | `typecheck` has no `dependsOn: ["^build"]`, so on a fresh clone `pnpm typecheck` fails in `packages/kubb` (TS2307 on `unplugin-kubb/*`). CI hides this by building first (.github/workflows/pr.yml:81). | Add `"dependsOn": ["^build"]`. |

Docs-only drift that is too small for its own row:
- packages/core/README.md:27 lists `defineMiddleware`, which does not exist.
- packages/studio/README.md:41-50 shows 6 of the 10 permissions.
- packages/studio/src/protocol.ts:421 names `allowRead` where the code checks `allowReadAst`.
- packages/ast/src/visitor.ts:151 misdescribes `depth: 'shallow'`.
- packages/plugin-barrel/src/plugin.ts:79 imports `defineConfig` from `@kubb/core`.
- packages/core/src/createStorage.ts:143 shows an example `empty()` that ignores `base`.

## Top 5: if you fix nothing else, fix these

1. **F001: escape the paths in `generateConfigFile`.**
   ```diff
   +import { printValue, quotes } from './configFile/text.ts'
   -  input: '${inputPath}',
   +  input: ${printValue(inputPath, quotes.single)},
   -    path: '${outputPath}',
   +    path: ${printValue(outputPath, quotes.single)},
   ```
   Test: with `inputPath: "a'b"` and `outputPath: 'C:\\new\\gen'`, the output parses with `parseSource` and round-trips both values.

2. **F002 + F034: send only the shape of the telemetry options, and make the payload build unable to throw.**
   ```ts
   function optionShape(v: unknown, d = 0): unknown {
     if (v === null || typeof v !== 'object' || d > 3) return typeof v
     if (Array.isArray(v)) return 'array'
     return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, optionShape(x, d + 1)]))
   }
   // trackRun: return async (result) => { try { await sendTelemetry(buildOtlpPayload(...)) } catch {} }
   ```
   Then update Telemetry.ts:24 and :195, index.ts:53, and docs/5.x/reference/telemetry.md.

3. **F004 + F005: add a policy, a timeout and an abort signal for remote `$ref`s.** In `load/source.ts`, `fetchSource(url, { signal, remote })` refuses private hosts and uses `redirect: 'error'` when `remote === 'public'`. It always combines `signal` with `AbortSignal.timeout(30_000)`. `normalize.ts:141` sets `remote = fileRefs ? 'public' : 'any'`. `adapter.ts:376` passes `signal` through `parseFromConfig` and `bundleDocument`. Test: `$ref: http://127.0.0.1:1/x.yaml` with `fileRefs: []` is refused.

4. **F010 + F011: stop losing diagnostics.**
   ```diff
   -const key = `${diagnostic.code} ${pointer} ${diagnostic.plugin ?? ''}`
   +const key = `${diagnostic.code}\0${pointer}\0${diagnostic.plugin ?? ''}\0${diagnostic.message}`
   ```
   In the bus-hook wrapper in `KubbDriver.#registerPlugin`, catch errors and rethrow them as `new Diagnostics.Error(Diagnostics.fromExtension(err, { kind: 'plugin', extension: plugin }))`. Test two location-less `ctx.warn` calls, and a throwing `kubb:plugins:end`.

5. **F006 + F007 + F008: make the loader safe against hostile specs.** Add a `WeakSet` of visited objects to `scanDocument`, `walk` and `inlinePathRefs`, and report a cycle as `invalidDocument`. Cap YAML alias events at 1000. In `resolveNode`, use `try { … } finally { resolvingRefs.delete(refPath) }` and catch only the missing-ref case. Add the three probe inputs (recursive anchor, alias bomb, converter throw) as tests.

## Quick wins (low effort, Medium or higher severity)

- [ ] F001: escape the paths in `generateConfigFile`
- [ ] F005: add a fetch timeout and pass the abort signal down
- [ ] F006: add a visited set to the document walkers
- [ ] F008: add `finally` and a narrow catch in `resolveNode`
- [ ] F009: add containment checks for MCP `output` and `input`
- [ ] F010: add the message to the dedupe key
- [ ] F012: resolve the adapter source before registering listeners
- [ ] F013: dispose the old driver in `setup()`
- [ ] F014: allow only http(s) in `openInBrowser`, and avoid `cmd start` on Windows
- [ ] F017: type-check `jobId`
- [ ] F019: refuse non-http `url` inputs in managed mode
- [ ] F022: add one `isExported` helper
- [ ] F024: add the digit prefix instead of replacing the digit
- [ ] F025: add `null` only when the schema is nullable
- [ ] F027: guard `decodeURIComponent` and use `Object.hasOwn`
- [ ] F028: forward `fileRefs` in `validate()`
- [ ] F034: wrap the telemetry payload build
- [ ] F049: make parser-md's core and ast peer dependencies

## Things that look bad but are actually fine

- **`spawn(process.execPath, ['-e', SENDER_SCRIPT])` for telemetry.** The script is a constant, and the payload goes in over stdin, so no untrusted data reaches argv or a shell.
- **`kubb add/update/remove` with ids sent by Studio (studio/src/connect.ts:239,254).** These run without a shell, and `REGISTRY_ID` requires a leading `[a-z0-9]`, so option injection such as `--registry` is impossible.
- **`writeFile(path.join(root, edit.document.fileName))` (studio/src/connect.ts:698).** The name is a fixed `openapi` prefix plus a suffix filtered by `[^\w.-]`, so a `..` segment cannot be formed.
- **`Object.defineProperty` instead of assignment (adapter-oas/src/emit/converters/composition.ts:89).** It is deliberate: `required: ['__proto__']` must not hit the prototype setter.
- **`getBaseUri` trusts `$self` (adapter-oas/src/load/normalize.ts:82-93).** The allowed folders come only from the host. Symlinks are resolved, and normalize.test.ts:661-711 tests this.
- **The `AsyncLocalStorage` singletons on `globalThis` (core/src/Diagnostics.ts:230, composables.ts:27).** These let a duplicated `@kubb/core` copy (ESM and CJS, or a bundled plugin) report into the same run. Diagnostics.test.ts:287 tests this.
- **`as unknown as` casts in the visitor (ast/src/visitor.ts:229,425) and in `getContext` (core/src/KubbDriver.ts:635).** Typing them properly would mean a switch per node kind on the hottest path, or a generic variance TypeScript cannot express. They are sound at runtime.
- **`fsStorage.empty` deletes in the background with `.catch(() => {})` (core/src/fsStorage.ts:69).** The trash prefix is swept again on the next run, so a failed delete is retried.
- **The `moved.ts` stubs that throw when called.** Published `@kubb/kit` 5.23.1 still imports them. Deleting them would turn a clear error into an import failure.
- **`combineImports` keeps a substring scan behind the identifier index (ast/src/utils/combineFileMembers.ts:143).** It errs toward keeping an import. An extra import is harmless, while a missing one breaks the output.
- **`jiti` and `yuku` look unused in `@kubb/cli`'s package.json.** They are needed at runtime by the bundled `@internals/shared`.
- **plugin-barrel depends on `@kubb/ast` and `@kubb/core` but imports only kit.** Kit lists them as peers, so the plugin has to install them.
- **`readFileSync` in async paths (utils/src/fs.ts:64, cli generate/utils.ts:211).** Both are deliberate and commented choices for speed on small reads.
- **schema.ts (697 lines) and visitor.ts (505 lines) are over the god-file threshold.** schema.ts is mostly per-variant types and JSDoc. visitor.ts is mostly a cycle-safe `findSchema`. Neither needs splitting.
- **The 10 `pnpm audit` advisories (vite, esbuild, launch-editor, zod 3).** All of them come in through dev-only `@farmfe/core` and `@changesets/cli`. `pnpm audit --prod` is clean.

## Open questions for the maintainer

- **Telemetry:** should `kubb.plugin_options` carry values at all? Would an allowlist of enum and boolean keys be enough?
- **Studio modes:** should Studio's `managed` flag be able to promote a `user` or `cli` agent (F016)? Should a sandboxed agent block remote `$ref` hosts (F004)?
- **Enums (#4758):** was `null` meant to be added to the enum for every 3.0 document, or only for nullable schemas (F025)?
- **Clean on failure:** should a failed parse preserve the previous output (F032)? It costs memory.
- **Deprecation removal:** what is the plan for `addGenerator`, `defineGenerator`, `setMacros`, kit's `definePlugin` and the deprecated AST fields? Until renderer-jsx stops writing them, the deprecated paths are what production runs.
- **Module format:** the packages are described as ESM-only, but core, kit, renderer-jsx, plugin-barrel and shared ship CJS. Is dual publishing intended for v5?
- **`withPublicFetch`:** does any host (for example the kubb-agent Docker image) run more than one `connectAgent` per process? That decides whether the global `fetch` swap is a live bug (F020).
- **Dependencies:** `kubb` hard-depends on `@kubb/cli`, `@kubb/mcp` and `@kubb/studio`, so every install pulls in the native `@napi-rs/keyring`. Is that intended? Is `@kubb/renderer-jsx` meant to be a required peer of `@kubb/mcp`?
- **Shared schemas:** `detectSharedSchemas` (core/src/detectSharedSchemas.ts:60) builds a new `AdapterSource`, so the adapter cache keyed by object identity misses. Are specs and remote refs fetched twice per build?

## Tooling notes

- `pnpm audit`: 10 advisories (2 high, 7 moderate, 1 low), all dev-only. `pnpm audit --prod`: none.
- `pnpm typecheck`: 12 of 13 packages pass. `kubb#typecheck` fails without a prior build (F066).
- `knip`, `madge` and `depcheck`: not run. Downloading them was not permitted. Dead exports were checked by hand with `rg` for the packages audited.
- No `.skip`, `.only` or `.todo` tests were found.
- Git history in this clone is shallow (50 commits), so the churn data covers only recent PRs.
