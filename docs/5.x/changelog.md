---
title: Changelog
description: Track all updates, features, and improvements to Kubb
layout: doc
sidebar: false
pageClass: changelog
outline: 2
---

# Changelog

## v5.14.6 — Oct 27, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Report a `$ref` that Kubb cannot read inside an `x-` vendor extension as a `KUBB_REF_NOT_FOUND` warning instead of an error. Kubb never reads extensions, so such a ref cannot change the output, and a spec like Spotify's no longer fails generation over it. ([#4479](https://github.com/kubb-labs/kubb/pull/4479))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.14.5 — Oct 27, 2026

### @kubb/core

#### Bug Fixes

- Resolve relative `$ref` files in inline input and parsed objects against `root`, the way a file input already does. A `$ref` to a file or URL Kubb cannot read now reports `KUBB_REF_NOT_FOUND` at the key that holds it, instead of leaving the type as `unknown`. The new `adapter.sources` lists the files and URLs the last parse read, and `generateModule` returns them, so a watcher can rebuild when a `$ref` file changes. ([#4478](https://github.com/kubb-labs/kubb/pull/4478))
- Let `resolveName`'s `normalize` return several names, so a declaration that emits more than one identifier takes a name only when all of them are free. A plugin naming an enum no longer has to allocate its value and its type alias in two passes. ([#4475](https://github.com/kubb-labs/kubb/pull/4475))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.14.4 — Oct 27, 2026

### @kubb/core

#### Bug Fixes

- Add `Resolver.reserveNames` and `Resolver.resolveName` to prevent duplicate exports. Keys can be strings or arrays. The driver reserves component names after applying macros and filters. ([#4474](https://github.com/kubb-labs/kubb/pull/4474))

### @kubb/kit

#### Bug Fixes

- Prevent union simplification from crashing on large schemas with shared references, including Stripe's OpenAPI specification. ([#4472](https://github.com/kubb-labs/kubb/pull/4472))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.14.3 — Oct 26, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Preserve parent `required` fields declared in `oneOf` and `anyOf` members without changing the referenced component schemas. ([#4471](https://github.com/kubb-labs/kubb/pull/4471))

### @kubb/kit

#### Bug Fixes

- Drop repeated members from unions, so `oneOf: [string, string, number]` becomes `string | number` for every plugin. ([#4468](https://github.com/kubb-labs/kubb/pull/4468))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.14.2 — Oct 25, 2026

### @kubb/adapter-oas

#### Bug Fixes

- A schema that is a single-member `allOf` around a `$ref` is no longer resolved to `unknown` as an alias cycle with itself. ([#4464](https://github.com/kubb-labs/kubb/pull/4464))
- An `encoding` style outside the OpenAPI set is no longer carried onto the request body content. ([#4465](https://github.com/kubb-labs/kubb/pull/4465))
- A parameter `style` outside the OpenAPI set is no longer carried onto the parameter. ([#4466](https://github.com/kubb-labs/kubb/pull/4466))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.14.1 — Oct 25, 2026

### @kubb/adapter-oas

#### Bug Fixes

- An `allOf` member that only holds annotations (`description`, `title`, `example`) or `if`/`then`/`else` no longer becomes `unknown`. The annotations move onto the parent schema. The conditional keywords are dropped, not enforced. ([#4456](https://github.com/kubb-labs/kubb/pull/4456))
- An `allOf` member that only lists `required` next to a `$ref` or properties no longer becomes `unknown`. The listed properties now keep their schema and stay required in the generated types, Zod schemas and fakers. ([#4454](https://github.com/kubb-labs/kubb/pull/4454))
- Discriminator mapping keys now take the type of the discriminator property. An `integer`, `number` or `boolean` discriminator produces `type_id: 1` or `z.literal(1)` instead of the string `'1'`, so the union members no longer collapse to `never` and valid payloads pass validation. ([#4458](https://github.com/kubb-labs/kubb/pull/4458))
- A `$ref` to a path outside `components.schemas`, such as `#/paths/~1foo/get/responses/200/content/application~1json/schema/items`, is now inlined. Before, it was named after its last segment and imported from a file that was never generated, so the output failed to compile. ([#4459](https://github.com/kubb-labs/kubb/pull/4459))
- A child schema that extends a discriminated parent through `allOf` and declares its own discriminator for grandchildren no longer collapses to `never`. The parent's discriminator property now accepts the keys of every level, the child keeps the parent's type, and a grandchild narrows to its own mapping key. ([#4460](https://github.com/kubb-labs/kubb/pull/4460))
- A `const` next to a `$ref` (OpenAPI 3.1) is no longer dropped. The property narrows to the literal, so a `z.discriminatedUnion` over members that pin the discriminator to different values no longer throws `Duplicate discriminator value`. ([#4455](https://github.com/kubb-labs/kubb/pull/4455))
- A Swagger 2.0 spec that uses the same external `$ref` twice inside a response schema no longer fails with `KUBB_REF_NOT_FOUND`. The bundler's second reference pointed at the old `responses/200/schema` location, which the upgrade to 3.x moves, so such references are now inlined before the upgrade. ([#4457](https://github.com/kubb-labs/kubb/pull/4457))
- Two schemas that only `$ref` each other no longer print a self-referencing type such as `export type Baz = Baz`. A chain of pure aliases that leads back to itself now resolves to `unknown`. ([#4461](https://github.com/kubb-labs/kubb/pull/4461))
- An unquoted `swagger: 2.0` (parsed by YAML as the number `2`) is now upgraded like `swagger: '2.0'`, so its `definitions` are no longer dropped. ([#4456](https://github.com/kubb-labs/kubb/pull/4456))

### @kubb/ast

#### Bug Fixes

- Each request body content entry now carries an `encoding` record with the `contentType`, `style`, `explode` and `allowReserved` of every property that sets one in the spec. ([#4463](https://github.com/kubb-labs/kubb/pull/4463))
- A `$ref` to a component whose name contains `/` or `~` now resolves to the same name as the component. The last segment of the pointer is decoded the way the resolver does it: percent-escapes first, then `~1` and `~0` (RFC 6901). Before, `#/components/schemas/a~1b~0c` imported `A1B0C` from a file that was never emitted, because the component itself is `a/b~c` and is emitted as `ABc`. ([#4462](https://github.com/kubb-labs/kubb/pull/4462))

### @kubb/cli

#### Bug Fixes

- `kubb update <id>` now exits with code 1 when it skips a named extension because it needs a newer Kubb or Node.js. Kubb Studio no longer reports such an update as a success. ([#4440](https://github.com/kubb-labs/kubb/pull/4440))

### @kubb/core

#### Bug Fixes

- A loop of schemas that only `$ref` each other now reports a `KUBB_ALIAS_CYCLE` warning, in addition to resolving to `unknown`. ([#4461](https://github.com/kubb-labs/kubb/pull/4461))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.14.0 — Oct 25, 2026

### @kubb/ast

#### Features

- Add inline sources. Files that import a source marked `inline: { expression }` get the expression in place of the name, and a file whose sources are all inline is not written. The parser for the file's extension supplies the language rules through the new `inline` member, which `parserTs` implements. ([#4438](https://github.com/kubb-labs/kubb/pull/4438))

  ```tsx
  <File.Source name="AddPetStatus200" isTypeOnly isExportable inline={{ expression: 'Pet' }}>
    {`export type AddPetStatus200 = Pet`}
  </File.Source>
  ```

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.13.1 — Oct 24, 2026

### @kubb/ast

#### Bug Fixes

- Add direct child and schema traversal helpers, early schema lookup, and ref resolution to the AST package.

  - Expose `forEachChild`, `forEachSchema`, `findSchema`, and `resolveRef`.
  - Keep OpenAPI `propertyNames` schemas on typed object nodes. ([#4437](https://github.com/kubb-labs/kubb/pull/4437))

### @kubb/cli

#### Bug Fixes

- `kubb add` writes parsers into `kubb.config.ts`, and `kubb update <id>` exits with code 1 when the id is not installed. ([#4431](https://github.com/kubb-labs/kubb/pull/4431))
- `kubb add` and `kubb init` edit `kubb.config.ts` without `@kubb/studio`. The config editor uses `yuku-parser` instead of `magicast`.

  Breaking: `applyConfigEdits` and `writeConfigEdits` are now `editConfig` and `editConfigFile`, and the `set` and `remove` operations are now `set-option` and `remove-option`. ([#4433](https://github.com/kubb-labs/kubb/pull/4433))
- `kubb remove` ignores plugins Studio switched off, and `kubb add` stops before installing a parser when there is no config. ([#4435](https://github.com/kubb-labs/kubb/pull/4435))
- Add `kubb remove <id>` and the `--allow-remove` permission for Studio. ([#4431](https://github.com/kubb-labs/kubb/pull/4431))

### @kubb/core

#### Bug Fixes

- Skip the Kubb version check for extensions on a canary build. ([#4436](https://github.com/kubb-labs/kubb/pull/4436))

### @kubb/studio

#### Bug Fixes

- The agent marks each installed extension that ships with `kubb` as `bundled`. ([#4435](https://github.com/kubb-labs/kubb/pull/4435))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.13.0 — Oct 24, 2026

### @kubb/adapter-oas

#### Features

- Require Node.js 22.22+ (chokidar 6) and reject malformed `servers[].url` values (`@readme/openapi-parser` 10). ([#4426](https://github.com/kubb-labs/kubb/pull/4426))

#### Bug Fixes

- Locate warning code frames in JSON specs without re-parsing. ([#4423](https://github.com/kubb-labs/kubb/pull/4423))
- Validate the spec in a worker thread during generation. ([#4421](https://github.com/kubb-labs/kubb/pull/4421))

### @kubb/ast

#### Bug Fixes

- AST nodes and diagnostics point at the spec key they came from, with a new `pointer` prop on `File.Source`. ([#4424](https://github.com/kubb-labs/kubb/pull/4424))
- Speed up generation by 8 to 20% on large specs, with the same output. ([#4415](https://github.com/kubb-labs/kubb/pull/4415))

### @kubb/core

#### Bug Fixes

- Drop `unstorage` and `lru-cache`; `kubbStorage` now only has `getItem`, `setItem` and `removeItem`. ([#4418](https://github.com/kubb-labs/kubb/pull/4418))

### @kubb/mcp

#### Bug Fixes

- Validate tool input with `valibot` instead of `zod`. ([#4417](https://github.com/kubb-labs/kubb/pull/4417))

### @kubb/parser-ts

#### Features

- Drop the TypeScript compiler dependency; printing compiler nodes is deprecated and needs `typescript` installed. ([#4416](https://github.com/kubb-labs/kubb/pull/4416))

### @kubb/studio

#### Bug Fixes

- Make `tsdown` an optional peer; `kubb studio snapshot` needs it installed. ([#4419](https://github.com/kubb-labs/kubb/pull/4419))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.12.8 — Oct 23, 2026

### @kubb/ast

#### Bug Fixes

- Parameters described with `content` instead of `schema` get their type from the media type's schema instead of `unknown`. `ParameterNode.contentType` holds that media type, so clients can JSON-encode the value. ([#4413](https://github.com/kubb-labs/kubb/pull/4413))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.12.7 — Oct 23, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Emit schemas declared in nested `$defs` and `definitions` blocks and resolve references to them. ([#4401](https://github.com/kubb-labs/kubb/pull/4401))
- `iri`, `iri-reference`, `base64url`, `jwt`, `ulid`, `iban` and `duration` no longer raise `KUBB_UNSUPPORTED_FORMAT`. Generated output is unchanged. ([#4412](https://github.com/kubb-labs/kubb/pull/4412))
- `uri-reference`, `hostname` and `idn-hostname` map to a string instead of a URL, so `plugin-zod` prints `z.string()` and relative references pass validation. ([#4410](https://github.com/kubb-labs/kubb/pull/4410))

### unplugin-kubb

#### Bug Fixes

- `root` defaults to the folder of `kubb.config.ts` instead of `process.cwd()`. A `*.openapi.yaml` import only uses a config whose `input` is that spec, and fails with `No Kubb config applies to <spec>` when none fits. ([#4409](https://github.com/kubb-labs/kubb/pull/4409))

### Contributors

Thanks to everyone who contributed to this release:

[@jay23606](https://github.com/jay23606), [@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.12.6 — Oct 23, 2026

### unplugin-kubb

#### Bug Fixes

- Import a `*.openapi.yaml` spec to get the output of every plugin in your config as one module. `kubb()` without a `config` option loads `kubb.config.ts`. ([#4402](https://github.com/kubb-labs/kubb/pull/4402))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.12.5 — Oct 22, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Parse specs with `js-yaml` first, which loads a 1.4 MB YAML spec in about 105 ms instead of 470 ms. A JSON spec with a duplicate key now fails with `KUBB_INVALID_DOCUMENT`. ([#4398](https://github.com/kubb-labs/kubb/pull/4398))
- `locate` compares the spec text once instead of on every call, so many pointer lookups on one spec run about 9× faster. ([#4394](https://github.com/kubb-labs/kubb/pull/4394))
- Cache the results of `camelCase` and `pascalCase`. ([#4399](https://github.com/kubb-labs/kubb/pull/4399))

### @kubb/ast

#### Bug Fixes

- Builds with `output.mode: 'file'` merge generator results once, which cuts a 1.9 MB spec from 3.3 s to 2.3 s. Named imports can come out in a different order. ([#4396](https://github.com/kubb-labs/kubb/pull/4396))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.12.4 — Oct 22, 2026

### @kubb/studio

#### Bug Fixes

- Studio can read and edit the root `output` options `barrel`, `format`, `lint`, `clean` and `defaultBanner` through the new `set-output` and `remove-output` config edits. ([#4390](https://github.com/kubb-labs/kubb/pull/4390))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.12.3 — Oct 22, 2026

### @kubb/core

#### Bug Fixes

- `checkoutGitInput` takes an `authorization` option and `GenerateInput` gains `gitAuth`, so Studio can fetch a private repository without a credential in the input URL. ([#4384](https://github.com/kubb-labs/kubb/pull/4384))

### @kubb/studio

#### Bug Fixes

- Studio can save the spec it sends as the agent's input, behind the new `--allow-save-input` permission. ([#4385](https://github.com/kubb-labs/kubb/pull/4385))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.12.2 — Oct 22, 2026

### @kubb/studio

#### Bug Fixes

- Studio can install and update registry extensions, behind the new `--allow-install` and `--allow-update` permissions. `kubb add` exits with code 1 when it cannot write the plugin into `kubb.config.ts`. ([#4382](https://github.com/kubb-labs/kubb/pull/4382))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.12.1 — Oct 22, 2026

### @kubb/core

#### Bug Fixes

- `checkoutGitInput` takes a `publicOnly` option that accepts https repositories on public addresses only. Core also exports `isPublicAddress`. ([#4381](https://github.com/kubb-labs/kubb/pull/4381))

### @kubb/studio

#### Bug Fixes

- A managed agent generates from a spec Studio sends: the document, a URL, or a `git+<repo>#<ref>:<path>` file. ([#4379](https://github.com/kubb-labs/kubb/pull/4379))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.12.0 — Oct 21, 2026

### @kubb/core

#### Features

- `input` reads a spec from a git repository with `git+<repo>#<ref>:<path>`. Private repositories use your git credentials and `kubb validate` accepts the same form. ([#4375](https://github.com/kubb-labs/kubb/pull/4375))

### @kubb/parser-ts

#### Bug Fixes

- Load the compiler API from `@typescript/typescript6`, so `print` keeps working next to TypeScript 7. Custom printers import `ts` from that package too. ([#4370](https://github.com/kubb-labs/kubb/pull/4370))

### kubb

#### Bug Fixes

- `defineConfig` reports unknown config keys, such as a misspelled `output.clean`. ([#4376](https://github.com/kubb-labs/kubb/pull/4376))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.11.6 — Oct 20, 2026

### @kubb/studio

#### Bug Fixes

- Report every entry of a `defineConfig([...])` array to Studio and generate from the entry Studio names. `loadConfig` on `connectAgent` is now `loadConfigs`. ([#4368](https://github.com/kubb-labs/kubb/pull/4368))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.11.5 — Oct 20, 2026

### @kubb/cli

#### Bug Fixes

- Rework the terminal output of every command: live progress for `kubb generate`, previews for `kubb add`, `kubb update` and `kubb init`, and one-line job logs for `kubb studio`. `kubb update --dry-run` replaces `--check`. ([#4355](https://github.com/kubb-labs/kubb/pull/4355))

### @kubb/core

#### Bug Fixes

- Kubb Studio generates the same code from editor drafts as from the saved `kubb.config.ts`. ([#4364](https://github.com/kubb-labs/kubb/pull/4364))
- Hooks report node counts, each written file and unchanged paths, and `Report` gains `filesUnchanged`. Diagnostics carry a `file:line:column` position. ([#4355](https://github.com/kubb-labs/kubb/pull/4355))

### @kubb/studio

#### Bug Fixes

- Accept `requestedBy` on `startGeneration` and `saveConfig` and name that Studio user in the agent log. ([#4362](https://github.com/kubb-labs/kubb/pull/4362))
- Export `applyConfigEdits`, and `PublishedSnapshot` gains `number` and `webUrl`. ([#4355](https://github.com/kubb-labs/kubb/pull/4355))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.11.4 — Oct 20, 2026

### @kubb/studio

#### Bug Fixes

- Keep Studio output on disk and make existing output available for review before generating. Read files with `{ jobId, paths }`; `jobType`, `source` and `FileSource` are removed. Upgrade Studio and its agents together. ([#4360](https://github.com/kubb-labs/kubb/pull/4360))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.11.3 — Oct 19, 2026

### @kubb/studio

#### Bug Fixes

- List existing output files when connecting an agent with read permission and read their contents on demand. ([#4358](https://github.com/kubb-labs/kubb/pull/4358))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.11.2 — Oct 19, 2026

### @kubb/studio

#### Bug Fixes

- Include existing output files when connecting an agent with read permission. ([#4356](https://github.com/kubb-labs/kubb/pull/4356))
- Refuse a Studio output path that resolves outside the config's output folder with `KUBB_PATH_TRAVERSAL`. ([#4353](https://github.com/kubb-labs/kubb/pull/4353))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.11.1 — Oct 18, 2026

### @kubb/cli

#### Bug Fixes

- Open `kubb generate` with the Kubb mascot in fixed 256-color codes. CI, AI agents and narrow terminals keep the plain `Kubb CLI vX` line. ([#4350](https://github.com/kubb-labs/kubb/pull/4350))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.11.0 — Oct 16, 2026

### @kubb/core

#### Features

- Filter operations by vendor extension: `include`, `exclude` and `override` accept `{ type: 'extension', key: 'x-…', value? }`. ([#4316](https://github.com/kubb-labs/kubb/pull/4316))

### Contributors

Thanks to everyone who contributed to this release:

[@mohammad-naji7](https://github.com/mohammad-naji7)

## v5.10.4 — Oct 15, 2026

### All packages

#### Bug Fixes

- Keep function and class names in the CommonJS build. ([#4340](https://github.com/kubb-labs/kubb/pull/4340))
- Require Node.js 22.12 or higher. `unplugin-kubb`, the bundler integrations in `kubb` and the test helpers ship as ES modules only; from CommonJS read the plugin from `.default`. ([#4343](https://github.com/kubb-labs/kubb/pull/4343))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.10.3 — Oct 15, 2026

### All packages

#### Bug Fixes

- Ship separate CommonJS type declarations, so `require` consumers get correct types under `moduleResolution: node16` and `nodenext`. `vitest` is an optional peer of `@kubb/core`, `@kubb/kit` and `kubb`. ([#4337](https://github.com/kubb-labs/kubb/pull/4337))

### @kubb/studio

#### Bug Fixes

- Diff large generated files in under a second; `readDiff` pages include `stats` and end on hunk boundaries. ([#4336](https://github.com/kubb-labs/kubb/pull/4336))
- Send generation events to Studio while the run is in progress. ([#4338](https://github.com/kubb-labs/kubb/pull/4338))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.10.2 — Oct 15, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Declare `@kubb/core` as a dependency, so the published types resolve under pnpm and other strict installers. ([#4332](https://github.com/kubb-labs/kubb/pull/4332))

### @kubb/core

#### Bug Fixes

- Diagnostics say why a build failed and how to fix it. A plugin listed twice in `plugins` now fails. ([#4329](https://github.com/kubb-labs/kubb/pull/4329))

### @kubb/studio

#### Bug Fixes

- Report the editable parts of an object option that also holds code, so Studio can edit `output.path` and keep `banner` as it is. ([#4330](https://github.com/kubb-labs/kubb/pull/4330))
- Add `readDiff` to the agent, so Studio shows the diff of a large generated file page by page. `@kubb/studio/protocol` exports `AgentMessage`, `FileSource` and `AgentPermission` const enums instead of loose constants. ([#4333](https://github.com/kubb-labs/kubb/pull/4333))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.10.1 — Oct 15, 2026

### @kubb/cli

#### Bug Fixes

- Telemetry reports `kubb.tty` and, for `kubb mcp`, the name of the connected MCP client. `startServer` in `@kubb/mcp` returns the server. ([#4325](https://github.com/kubb-labs/kubb/pull/4325))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.10.0 — Oct 15, 2026

### @kubb/adapter-oas

#### Features

- Keep server variables on `InputMeta.servers`. `InputServer` gains an optional `variables` field with the source URL template's variables, copied as-is next to the resolved `url`, so a consumer can tell a templated server from a literal one. It is absent when the server declares no variables. ([#4315](https://github.com/kubb-labs/kubb/pull/4315))

#### Bug Fixes

- Carry vendor extensions on the AST. `OperationNode` and `InputMeta` gain an optional `extensions` bag with every `x-*` key copied as-is, set only when the source has one. The OAS adapter fills it from the operation object and the document root, so plugins can read keys like `x-org-ignore` without walking the raw document. Path-level extensions are not copied. ([#4311](https://github.com/kubb-labs/kubb/pull/4311))

### @kubb/cli

#### Bug Fixes

- Remove `KUBB_AGENT_TOKEN` from `kubb studio`. The CLI now connects only through a paired machine, and in CI you run `kubb studio snapshot` with `KUBB_TOKEN` instead. ([#4317](https://github.com/kubb-labs/kubb/pull/4317))

### @kubb/studio

#### Features

- Add a separate `allowReadAst` permission (`--allow-read-ast`) for reading the parsed spec. `allowRead` now covers only generated files, so projects that granted `allowRead` before are asked once more about the spec. ([#4320](https://github.com/kubb-labs/kubb/pull/4320))

### Contributors

Thanks to everyone who contributed to this release:

[@mohammad-naji7](https://github.com/mohammad-naji7), [@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.9.6 — Oct 15, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Keep `allowReserved` on parameters as `ParameterNode.allowReserved`. ([#4304](https://github.com/kubb-labs/kubb/pull/4304))

### @kubb/ast

#### Bug Fixes

- Keep the JSON Schema `not` keyword as a `not` schema node instead of dropping it. TypeScript output does not change. ([#4308](https://github.com/kubb-labs/kubb/pull/4308))
- Keep every `Heading`, `Paragraph`, `List`, `Callout` and `Frontmatter` in a markdown file instead of only the first of each kind. ([#4302](https://github.com/kubb-labs/kubb/pull/4302))

### Contributors

Thanks to everyone who contributed to this release:

[@mohammad-naji7](https://github.com/mohammad-naji7), [@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.9.5 — Oct 15, 2026

### @kubb/studio

#### Bug Fixes

- Agents with `--allow-read` return the Kubb AST through `readInput`, so Kubb Studio can describe your API. `InputMeta` gains `servers` and `securitySchemes`. ([#4300](https://github.com/kubb-labs/kubb/pull/4300))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.9.4 — Oct 14, 2026

### @kubb/ast

#### Bug Fixes

- Remove `OutputNode`, `createOutput`, `ast.factory.update`, `InferSchemaNode` and the `@kubb/ast/types` subpath. `Ipv4SchemaNode` and `Ipv6SchemaNode` become `'ipv4' | 'ipv6'` scalars. Add `ast.refName(ref)`. ([#4293](https://github.com/kubb-labs/kubb/pull/4293))

### @kubb/cli

#### Bug Fixes

- Load the config with one loader and drop the `unconfig` dependency. Config discovery is unchanged. ([#4293](https://github.com/kubb-labs/kubb/pull/4293))

### @kubb/core

#### Bug Fixes

- `createAdapter`, `defineParser` and `definePlugin` accept only the definition object; use `defineExtension`. Remove `Storage.existsItem`, `FileManagerHooks`, `FileManager#hooks` and `applyConfigDefaults`. ([#4293](https://github.com/kubb-labs/kubb/pull/4293))

### @kubb/kit

#### Bug Fixes

- `Url.toGroupedTemplateString` uses dot access for path parameters named like reserved words. ([#4293](https://github.com/kubb-labs/kubb/pull/4293))

### @kubb/mcp

#### Bug Fixes

- `generate` finds the config the way `kubb generate` does, and `init` hands plugin installs to `kubb add`. ([#4293](https://github.com/kubb-labs/kubb/pull/4293))

### @kubb/parser-md

#### Bug Fixes

- `parserMd().print` takes markdown strings and reads frontmatter from `file.meta.frontmatter`. ([#4293](https://github.com/kubb-labs/kubb/pull/4293))

### @kubb/renderer-jsx

#### Bug Fixes

- Remove the `@kubb/renderer-jsx/types` subpath; import types from the root. Component props are the matching `@kubb/ast` node fields. ([#4293](https://github.com/kubb-labs/kubb/pull/4293))

### unplugin-kubb

#### Bug Fixes

- Print the `kubb generate` summary after a build and apply the `defineConfig` defaults. Remove the `unplugin-kubb/types` and `unplugin-kubb/unpluginFactory` subpaths and the `BarrelType` re-export. ([#4293](https://github.com/kubb-labs/kubb/pull/4293))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.9.3 — Oct 14, 2026

### @kubb/cli

#### Bug Fixes

- `kubb add` without an id asks which extension to add from the registry, and `kubb update` asks which updates to install. ([#4291](https://github.com/kubb-labs/kubb/pull/4291))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.9.2 — Oct 13, 2026

### @kubb/core

#### Bug Fixes

- Fix `readInstalledPackages` throwing when `root` is a relative path, which made CI snapshots fail. ([#4288](https://github.com/kubb-labs/kubb/pull/4288))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.9.1 — Oct 13, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Parse OpenAPI 3.2 `query` operations (HTTP `QUERY`) instead of dropping them. ([#4285](https://github.com/kubb-labs/kubb/pull/4285))

### @kubb/ast

#### Bug Fixes

- Remove `defineNode`, `NodeDef`, `nodeDefs` and the `*Def` objects. `StatusCode` accepts any three-digit status string. ([#4278](https://github.com/kubb-labs/kubb/pull/4278))

### @kubb/cli

#### Bug Fixes

- `kubb init` takes its plugins from the Kubb registry and stops before installing when a plugin's dependencies are missing. ([#4275](https://github.com/kubb-labs/kubb/pull/4275))

### @kubb/core

#### Bug Fixes

- Report extension crashes as `KUBB_PLUGIN_FAILED`, `KUBB_ADAPTER_FAILED` or `KUBB_PARSER_FAILED` with a link to the extension's issue tracker from `meta.issues`. ([#4279](https://github.com/kubb-labs/kubb/pull/4279))
- Rename `PluginFactoryOptions` to `PluginType`. Remove `KubbDriver.dispatch` and `KubbDriver.hasHookGenerators`. ([#4278](https://github.com/kubb-labs/kubb/pull/4278))
- Add `optionalDependencies` to `kubb-extension.json` and reject an unknown `role`. ([#4275](https://github.com/kubb-labs/kubb/pull/4275))

### @kubb/kit

#### Bug Fixes

- Remove `Url.toTemplateString` and `Url.toObject`. ([#4278](https://github.com/kubb-labs/kubb/pull/4278))

### @kubb/studio

#### Bug Fixes

- Config edits and `readConfig` cover the adapter and parsers, so Studio can edit and save their options. ([#4282](https://github.com/kubb-labs/kubb/pull/4282)), ([#4276](https://github.com/kubb-labs/kubb/pull/4276))
- A `null` option value from Studio unsets the value from `kubb.config.ts` for that generate. ([#4278](https://github.com/kubb-labs/kubb/pull/4278))

### Contributors

Thanks to everyone who contributed to this release:

[@mohammad-naji7](https://github.com/mohammad-naji7), [@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.9.0 — Oct 13, 2026

### @kubb/cli

#### Features

- The [Kubb registry](/docs/5.x/reference/registry) is stable. [`kubb add`](/docs/5.x/reference/commands/add) installs a reviewed plugin, adapter, or parser at the version the registry pins, [`kubb update`](/docs/5.x/reference/commands/update) moves installed extensions to that version, and [`kubb list`](/docs/5.x/reference/commands/list) shows what is installed. Registry support landed across 5.8.1 to 5.8.4.

### unplugin-kubb

#### Bug Fixes

- Generate once per build in every bundler. webpack and Rspack no longer rebuild forever in watch mode with `output.clean`, and Astro no longer generates twice. ([#4266](https://github.com/kubb-labs/kubb/pull/4266))
- Register the Nuxt module with the Rspack builder too, and generate only in the client build of `nuxt build`. The module now needs `@nuxt/kit` 3.14 or later. ([#4266](https://github.com/kubb-labs/kubb/pull/4266))
- Fail the build when `config` is missing, and log `✗ Generation failed` when generation fails. ([#4266](https://github.com/kubb-labs/kubb/pull/4266))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.8.4 — Oct 13, 2026

### @kubb/core

#### Features

- Registry entries can pin a GitHub release. `kubb add` and `kubb update` install it as `github:<owner>/<repo>#<commit>`. ([#4264](https://github.com/kubb-labs/kubb/pull/4264))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.8.3 — Oct 13, 2026

### @kubb/core

#### Features

- Add `maintainers` and `dependencies` to `kubb-extension.json`. Each package now ships its overview, options page, and guides in a `docs/` folder. ([#4260](https://github.com/kubb-labs/kubb/pull/4260))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.8.2 — Oct 13, 2026

### @kubb/core

#### Features

- Add [`defineExtension`](/docs/5.x/reference/kit/extensions) to define a plugin, an adapter, or a parser. `definePlugin`, `defineParser`, and `createAdapter` still work but are deprecated. ([#4258](https://github.com/kubb-labs/kubb/pull/4258))

  ```ts
  export const pluginZod = defineExtension<PluginZod>({
    kind: 'plugin',
    meta: { name: 'plugin-zod' },
    setup(options, kubb) {
      kubb.addGenerator(zodGenerator)
      return options
    },
  })
  ```

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.8.1 — Oct 13, 2026

### @kubb/cli

#### Features

- Add `kubb add`, `kubb update`, and `kubb list` to install and update extensions from the Kubb registry. ([#4253](https://github.com/kubb-labs/kubb/pull/4253))

### @kubb/core

#### Features

- Add the `kubb-extension.json` manifest. Studio runs installed third-party plugins that ship one. ([#4253](https://github.com/kubb-labs/kubb/pull/4253))
- `createAdapter` takes an object with `meta`, `setup`, and `build`, like `definePlugin`. `defineParser` takes `build` instead of `setup`. ([#4249](https://github.com/kubb-labs/kubb/pull/4249))

#### Bug Fixes

- Remove the options `schema` from `definePlugin` and `@kubb/kit/options`, both added in 5.8.0. Type plugin options with TypeScript and apply their defaults in `setup`. ([#4252](https://github.com/kubb-labs/kubb/pull/4252))

### @kubb/plugin-barrel

#### Bug Fixes

- A `barrel: false` plugin that writes to the output root no longer removes the other plugins' barrels. ([#4254](https://github.com/kubb-labs/kubb/pull/4254))
- A plugin without `output.path` no longer takes over the other plugins' barrels. ([#4255](https://github.com/kubb-labs/kubb/pull/4255))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.8.0 — Oct 12, 2026

### @kubb/core

#### Features

- Add an options `schema` to `definePlugin`, and shared Zod schemas in `@kubb/kit/options`. 5.8.1 removed both. ([#4244](https://github.com/kubb-labs/kubb/pull/4244), [#4245](https://github.com/kubb-labs/kubb/pull/4245))

#### Bug Fixes

- Composables such as `setResolver()` work in plugins that a CommonJS config loads, instead of failing with `KUBB_NO_CONTEXT`. ([#4246](https://github.com/kubb-labs/kubb/pull/4246))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.7.0 — Oct 12, 2026

### @kubb/core

#### Features

- `definePlugin` and `defineParser` accept an object with `meta`, `dependencies`, and `setup(options, kubb)`. The factory form is deprecated. A mismatch in `meta.compatibility` or `dependencies` fails the run with `KUBB_INCOMPATIBLE_EXTENSION`, `KUBB_MISSING_DEPENDENCY`, or `KUBB_INCOMPATIBLE_DEPENDENCY`. ([#4241](https://github.com/kubb-labs/kubb/pull/4241))
- Add composables to `kubb/kit`, such as `addGenerator()`, `setResolver()`, and `useOptions()`, so a plugin can call setup helpers without passing `ctx` around. ([#4240](https://github.com/kubb-labs/kubb/pull/4240))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.6.3 — Oct 12, 2026

### @kubb/core

#### Bug Fixes

- Add `ctx.requirePlugin(name)` and `assertPluginOption()` for plugin setup checks, and `createMockedSetupContext()` in `@kubb/kit/testing` for unit tests. ([#4238](https://github.com/kubb-labs/kubb/pull/4238))

### @kubb/mcp

#### Bug Fixes

- Validate MCP tool arguments with Zod Mini instead of valibot. Invalid arguments now return Zod's error messages. ([#4234](https://github.com/kubb-labs/kubb/pull/4234))

### @kubb/studio

#### Bug Fixes

- Harden the `kubb studio` agent's config edits and sandbox input, and reload JavaScript configs on every generation. ([#4233](https://github.com/kubb-labs/kubb/pull/4233))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.6.2 — Oct 11, 2026

### @kubb/studio

#### Bug Fixes

- `kubb studio snapshot` works when `kubb.config.ts` does not set `storage`, and no longer leaves a temp folder behind. ([#4231](https://github.com/kubb-labs/kubb/pull/4231), [#4229](https://github.com/kubb-labs/kubb/pull/4229))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.6.1 — Oct 11, 2026

### @kubb/cli

#### Bug Fixes

- Rebuild once per editor save in `kubb generate --watch`. An atomic save (write a temp file, then rename it) could trigger two rebuilds, because the 100 ms debounce matched chokidar's 100 ms atomic-save window. The debounce is now 250 ms. ([#4227](https://github.com/kubb-labs/kubb/pull/4227), [`4ba64cf`](https://github.com/kubb-labs/kubb/commit/4ba64cf431201531556e41efd7b7ca2ea386d1a9))

### @kubb/core

#### Bug Fixes

- Add `kubbStorage` and `resolveKubbDir` for the files Kubb keeps for itself under `~/.kubb` (or `KUBB_HOME`). The `file` and `html` reporters write through it. ([#4225](https://github.com/kubb-labs/kubb/pull/4225), [`30f9f4d`](https://github.com/kubb-labs/kubb/commit/30f9f4d1bd4bf190564d54b953e8b6e27a558c3a))

### @kubb/studio

#### Bug Fixes

- Connect to Kubb Studio over one WebSocket, and publish CI snapshots in one request. Needs a Kubb Studio release that accepts Kubb 5.6.1 agents. `kubb studio snapshot` drops `--timeout` and the `--allow-*` flags. ([#4225](https://github.com/kubb-labs/kubb/pull/4225), [`30f9f4d`](https://github.com/kubb-labs/kubb/commit/30f9f4d1bd4bf190564d54b953e8b6e27a558c3a))

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
  
  Formatter and linter detection for `'auto'` also finds a tool installed only in `node_modules/.bin` under `config.root`, the folder the tool then runs from. ([#4218](https://github.com/kubb-labs/kubb/pull/4218), [`0fb79d5`](https://github.com/kubb-labs/kubb/commit/0fb79d56b52c32d621875857135877b26b001ab0))
- Fold single-use helpers and duplicated types in the core driver, resolver, storage and diagnostics. Generated output and the plugin API do not change. ([#4203](https://github.com/kubb-labs/kubb/pull/4203), [`d1b5a6a`](https://github.com/kubb-labs/kubb/commit/d1b5a6a717fde727c0a9c0bfb3ab72aa8e60e844))
- Keep a failing hook listener's error message to the hook name. The message no longer serializes the hook arguments, which could be a whole config or AST subtree. ([#4193](https://github.com/kubb-labs/kubb/pull/4193), [`ee09318`](https://github.com/kubb-labs/kubb/commit/ee09318741f86c00512f3c862e9d0e05aadd6f95))
- Correct doc comments so they match what the code does: `group.name` keeps the first path segment as written for `path` groups, and the `defaultBanner` example shows the banner Kubb writes. ([#4186](https://github.com/kubb-labs/kubb/pull/4186), [`425998f`](https://github.com/kubb-labs/kubb/commit/425998fb04946afc1493f22ee859eadb1f3b8d8c))

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

- Studio runs a generation through `@kubb/core`, so the format, lint, and `output.postGenerate` passes run there too. ([#4214](https://github.com/kubb-labs/kubb/pull/4214), [`56a24f2`](https://github.com/kubb-labs/kubb/commit/56a24f23d7acf8bb13ee279d9f7f0f59e812b1da))

#### Bug Fixes

- Internal cleanup of `@kubb/studio`, including the agent connection and the snapshot upload. ([#4208](https://github.com/kubb-labs/kubb/pull/4208), [#4212](https://github.com/kubb-labs/kubb/pull/4212), [#4191](https://github.com/kubb-labs/kubb/pull/4191))

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
