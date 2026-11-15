---
layout: doc
title: Diagnostics
description: Reference for every Kubb diagnostic code, with its severity, cause, and fix, plus the terminal, agent, and JSON formats Kubb reports them in.
outline:
  - 2
  - 3
order: 7
navigation:
  title: Diagnostics
  icon: i-iconoir-warning-triangle
---

# Diagnostics

Kubb reports each problem as a diagnostic: a stable code, a message, the location in your spec, and a fix. Each code links to its entry on this page.

::code-group

```text [Terminal]
  ✖ Could not find a definition for #/components/schemas/Owner.     KUBB_REF_NOT_FOUND
    at   petStore.yaml:336:17
    fix  Add the schema under `components.schemas`, or fix the `$ref`. Run `kubb validate` to check the spec.
    ↳ Learn more  kubb.dev/docs/5.x/reference/diagnostics#kubb-ref-not-found
```

```text [Agent]
error KUBB_REF_NOT_FOUND: Could not find a definition for #/components/schemas/Owner.
  at: petStore.yaml:336:17 (#/components/schemas/Owner)
  why: A `$ref` could not be resolved in the source document.
  fix: Add the schema under `components.schemas`, or fix the `$ref`. Run `kubb validate` to check the spec.
  docs: https://kubb.dev/docs/5.x/reference/diagnostics#kubb-ref-not-found
✗ Generation failed  202ms

  28 files generated
  Plugins  3 passed
  Issues   1 error
  Target   ./src/gen
```

::

An interactive terminal gets the first format. An AI agent, CI, or a pipe gets plain labeled rows that explain the problem on their own, with the reporting plugin in brackets after the code.

| Severity | Effect |
| --- | --- |
| Error | Fails the run. `kubb generate` exits with code 1. |
| Warning | Reported. The run continues. |
| Info | Advisory. Never fails the run. |

## Crashes {#crashes}

`KUBB_ADAPTER_FAILED`, `KUBB_PARSER_FAILED`, `KUBB_PLUGIN_FAILED`, `KUBB_INTERNAL_ERROR`, and `KUBB_UNKNOWN` mark a crash. The agent format then adds the first `stack:` frames, the terminal shows the stack with `--verbose`, and `--reporter json` adds `stack`. When the extension sets [`meta.issues`](/docs/5.x/reference/kit/extensions#meta), Kubb prints its tracker as a `report:` link: report the crash there with the stack and a spec fragment that reproduces it.

## Codes

| Code | Severity | Cause |
| --- | --- | --- |
| [`KUBB_ADAPTER_FAILED`](#kubb-adapter-failed) | Error | The adapter crashed while parsing |
| [`KUBB_ADAPTER_REQUIRED`](#kubb-adapter-required) | Error | A plugin needs the OpenAPI adapter |
| [`KUBB_BARREL_DUPLICATE_EXPORT`](#kubb-barrel-duplicate-export) | Error | Two files in one barrel export the same name |
| [`KUBB_CLEAN_ROOT`](#kubb-clean-root) | Error | `output.clean` would wipe the project root |
| [`KUBB_FORMAT_FAILED`](#kubb-format-failed) | Error | The formatter failed |
| [`KUBB_GIT_INPUT_FAILED`](#kubb-git-input-failed) | Error | A git `input` is malformed or cannot be fetched |
| [`KUBB_INCOMPATIBLE_DEPENDENCY`](#kubb-incompatible-dependency) | Error | A dependency plugin's version is out of range |
| [`KUBB_INCOMPATIBLE_EXTENSION`](#kubb-incompatible-extension) | Error | The running Kubb or Node.js is out of range |
| [`KUBB_INLINE_FAILED`](#kubb-inline-failed) | Error | An inline source could not be inlined |
| [`KUBB_INPUT_NOT_FOUND`](#kubb-input-not-found) | Error | The `input` file cannot be read |
| [`KUBB_INPUT_REQUEST_FAILED`](#kubb-input-request-failed) | Error | A URL answered 4xx or 5xx |
| [`KUBB_INPUT_REQUIRED`](#kubb-input-required) | Error | An adapter is set, but no `input` |
| [`KUBB_INPUT_UNREACHABLE`](#kubb-input-unreachable) | Error | A URL never answered |
| [`KUBB_INTERNAL_ERROR`](#kubb-internal-error) | Error | A bug in Kubb |
| [`KUBB_INVALID_DOCUMENT`](#kubb-invalid-document) | Error | The input is not an OpenAPI or Swagger document |
| [`KUBB_INVALID_PLUGIN_OPTIONS`](#kubb-invalid-plugin-options) | Error | Plugin options or entries that cannot work |
| [`KUBB_INVALID_SERVER_VARIABLE`](#kubb-invalid-server-variable) | Error | A server variable is not in its `enum` |
| [`KUBB_LEGACY_INPUT`](#kubb-legacy-input) | Error | `input` uses the v4 `{ path }` or `{ data }` wrapper |
| [`KUBB_LINT_FAILED`](#kubb-lint-failed) | Error | The linter failed |
| [`KUBB_MISSING_DEPENDENCY`](#kubb-missing-dependency) | Error | A required dependency plugin is missing |
| [`KUBB_NO_CONTEXT`](#kubb-no-context) | Error | A `kubb/kit` composable ran outside setup |
| [`KUBB_PARSER_FAILED`](#kubb-parser-failed) | Error | A parser crashed while printing |
| [`KUBB_PATH_TRAVERSAL`](#kubb-path-traversal) | Error | A path escapes the output folder |
| [`KUBB_PLUGIN_FAILED`](#kubb-plugin-failed) | Error | A plugin crashed or reported an error |
| [`KUBB_PLUGIN_NOT_FOUND`](#kubb-plugin-not-found) | Error | A plugin requires one that is not in the config |
| [`KUBB_POST_GENERATE_FAILED`](#kubb-post-generate-failed) | Error | An `output.postGenerate` command failed |
| [`KUBB_REF_NOT_FOUND`](#kubb-ref-not-found) | Error, or warning inside `x-` | A `$ref` cannot be resolved |
| [`KUBB_UNKNOWN`](#kubb-unknown) | Error | An error without a specific code |
| [`KUBB_ALIAS_CYCLE`](#kubb-alias-cycle) | Warning | Schemas only `$ref` each other |
| [`KUBB_DUPLICATE_DISCRIMINATOR`](#kubb-duplicate-discriminator) | Warning | Two union members share a discriminator value |
| [`KUBB_INVALID_SPEC`](#kubb-invalid-spec) | Warning, error in `kubb validate` | The spec fails OpenAPI validation |
| [`KUBB_PLUGIN_WARNING`](#kubb-plugin-warning) | Warning | A plugin called `ctx.warn` |
| [`KUBB_UNSUPPORTED_FORMAT`](#kubb-unsupported-format) | Warning | A schema `format` has no specific type |
| [`KUBB_DEPRECATED`](#kubb-deprecated) | Info | A schema or operation is `deprecated` |
| [`KUBB_PERFORMANCE`](#kubb-performance) | Info | A plugin's timing record |
| [`KUBB_PLUGIN_INFO`](#kubb-plugin-info) | Info | A plugin called `ctx.info` |
| [`KUBB_UPDATE_AVAILABLE`](#kubb-update-available) | Info | A newer Kubb is on npm |

## Errors

### KUBB_ADAPTER_FAILED: Adapter failed {#kubb-adapter-failed}

**Cause:** The adapter crashed while parsing the input. Errors it reports on purpose, such as `KUBB_REF_NOT_FOUND`, keep their own code.

**Fix:** Check the input and the adapter options. Report a bug to the adapter's maintainers, as in [Crashes](#crashes).

### KUBB_ADAPTER_REQUIRED: Adapter required {#kubb-adapter-required}

**Cause:** `@kubb/plugin-redoc` runs with an adapter other than the OpenAPI adapter, or with none. `defineConfig` adds the OpenAPI adapter when `adapter` is left out, so this happens only with a custom adapter or with `createKubb` from `@kubb/core`.

**Fix:** Set `adapter: adapterOas()` in `kubb.config.ts`.

### KUBB_BARREL_DUPLICATE_EXPORT: Duplicate barrel export {#kubb-barrel-duplicate-export}

**Cause:** Two files in one barrel folder export the same name. The barrel keeps the first and drops the rest, so the code still parses, but the run fails. A type and a value may share a name.

**Fix:** Rename one declaration, change the [resolver](/docs/5.x/reference/plugin-options#resolver), or give the plugins separate output folders.

### KUBB_CLEAN_ROOT: Clean targets the project root {#kubb-clean-root}

**Cause:** `output.clean` is on and `output.path` is the project root or a parent of it, so cleaning would delete `kubb.config` and your source files.

**Fix:** Point `output.path` at a generated folder such as `./src/gen`, or turn off `output.clean`.

### KUBB_FORMAT_FAILED: Format failed {#kubb-format-failed}

**Cause:** The [`output.format`](/docs/5.x/reference/configuration#outputformat) tool failed. The files are written, but the run fails.

**Fix:** Check that the formatter (oxfmt, Biome, or Prettier) is installed and its config is valid. Run it on the output folder to see the error.

### KUBB_GIT_INPUT_FAILED: Git input failed {#kubb-git-input-failed}

**Cause:** A [git `input`](/docs/5.x/reference/configuration#input) is malformed, or `git` could not fetch it: git is missing, the repository or ref does not exist, or the credentials were refused.

**Fix:** Write the input as `git+<repo>#<ref>:<path>`. Run `git fetch --depth 1 <repo> <ref>` to see the git error. For a private repository, set up a credential helper or SSH key.

### KUBB_INCOMPATIBLE_DEPENDENCY: Incompatible dependency {#kubb-incompatible-dependency}

**Cause:** A plugin's `dependencies` record sets a `version` range, and the configured plugin's `meta.version` is outside it. A dependency without `meta.version` is not checked.

**Fix:** Install a version of the dependency inside the range, or a version of the dependent plugin that supports it.

### KUBB_INCOMPATIBLE_EXTENSION: Incompatible extension {#kubb-incompatible-extension}

**Cause:** An extension's `meta.compatibility.kubb` or `meta.compatibility.node` range excludes the running version. Kubb checks it before any plugin runs, and `kubb add` before it installs.

**Fix:** Upgrade Kubb or Node.js into the range, or install a version of the extension that supports yours.

### KUBB_INLINE_FAILED: Inline definition failed {#kubb-inline-failed}

**Cause:** A file imports a name from a file whose sources are all inline, and the name has no inline definition, refers to itself, or has no parser that supports inlining. One diagnostic lists every case. The inline file is not written.

**Fix:** Give every imported name an inline definition, register a parser with inline support for the extension, or stop marking the source as inline.

### KUBB_INPUT_NOT_FOUND: Input not found {#kubb-input-not-found}

**Cause:** The `input` file, or the path passed to `kubb generate <path>`, cannot be read. A URL reports `KUBB_INPUT_REQUEST_FAILED` or `KUBB_INPUT_UNREACHABLE` instead.

**Fix:** Check that the file exists and is readable. A relative path resolves against [`root`](/docs/5.x/reference/configuration#root).

### KUBB_INPUT_REQUEST_FAILED: Input request failed {#kubb-input-request-failed}

**Cause:** A URL `input` or `$ref` answered with a 4xx or 5xx status. The extension commands also report it for an invalid [registry](/docs/5.x/reference/registry) index.

**Fix:** Open the URL to see the answer. Kubb sends no credentials, so for a 401 or 403, download the document and use the local file. A 404 means a wrong path, and a 5xx a failing server.

### KUBB_INPUT_REQUIRED: Input required {#kubb-input-required}

**Cause:** An adapter is configured, but `input` is empty.

**Fix:** Set `input` to a file path, a URL, a git input, inline JSON or YAML, or a parsed object.

### KUBB_INPUT_UNREACHABLE: Input unreachable {#kubb-input-unreachable}

**Cause:** A URL `input`, a `$ref` URL, or the registry never answered: a refused connection, an unknown host, an expired certificate, or a timeout. The message names which.

**Fix:** Check that the host runs and is reachable from this machine, through any VPN or proxy. For a local server, start it and check the port.

### KUBB_INTERNAL_ERROR: Internal error {#kubb-internal-error}

**Cause:** Kubb reached a state it does not expect. This is a bug in Kubb, not in your config or spec.

**Fix:** Rerun with `--reporter json` or `--verbose` to get the stack, then [open an issue](https://github.com/kubb-labs/kubb/issues) with the spec and config that trigger it.

### KUBB_INVALID_DOCUMENT: Invalid document {#kubb-invalid-document}

**Cause:** The `input` has a JSON or YAML syntax error, declares no `openapi` or `swagger` version, or has a version Kubb cannot upgrade to OpenAPI 3.1. This fails even with validation off.

**Fix:** Fix the syntax at the reported line, and check that `input` is the spec, not an HTML page or a wrapper object. Use Swagger 2.0 or OpenAPI 3.0, 3.1, or 3.2.

### KUBB_INVALID_PLUGIN_OPTIONS: Invalid plugin options {#kubb-invalid-plugin-options}

**Cause:** The `plugins` array or a plugin's options cannot work as given. The message names the case:

- File output (`output.mode: 'file'`, or an `output.path` with an extension) with a `group` option.
- File output with `sdk.mode: 'tag'` on `@kubb/plugin-fetch`, `@kubb/plugin-axios`, or `@kubb/plugin-client`.
- An option set to a value it does not accept.
- A `plugins` entry that is not a plugin, such as `pluginTs` instead of `pluginTs()`.
- The same plugin twice, or plugin `dependencies` that form a cycle.
- An extension without `meta.name` or `name`.
- `@kubb/plugin-faker` with a `dateParser` that cannot format the adapter's `dateType: 'date'` values.

**Fix:** Change what the message names. A single file has nothing to group or split, so remove `group`, use `sdk.mode: 'flat'`, or write to a directory.

### KUBB_INVALID_SERVER_VARIABLE: Invalid server variable {#kubb-invalid-server-variable}

**Cause:** A server variable resolves to a value its `enum` does not allow. The value comes from the adapter's `server.variables` option or the variable's `default`.

**Fix:** Use a value from the `enum`, or fix the `default` or the `enum` in the spec.

### KUBB_LEGACY_INPUT: Legacy input shape {#kubb-legacy-input}

**Cause:** `input` is a `{ path }` or `{ data }` wrapper. v4 needed it, and v5 takes the value directly.

**Fix:** Replace `input: { path: './petStore.yaml' }` with `input: './petStore.yaml'`, and `input: { data: spec }` with `input: spec`.

### KUBB_LINT_FAILED: Lint failed {#kubb-lint-failed}

**Cause:** The [`output.lint`](/docs/5.x/reference/configuration#outputlint) tool failed. The files are written, but the run fails.

**Fix:** Check that the linter (oxlint, Biome, or ESLint) is installed and its config is valid. Run it on the output folder, and relax its rules for generated files.

### KUBB_MISSING_DEPENDENCY: Missing dependency {#kubb-missing-dependency}

**Cause:** A plugin lists another plugin in its `dependencies` record without `optional: true`, and the config does not include it. A `dependencies` array only orders plugins and never raises this code.

**Fix:** Install the missing plugin and add it to `plugins` in `kubb.config.ts`.

### KUBB_NO_CONTEXT: No plugin context {#kubb-no-context}

**Cause:** A `kubb/kit` composable such as `useKubb()` or `addGenerator()` ran outside `setup` and `kubb:plugin:setup`, so it has no plugin to apply to. The message names the composable.

**Fix:** Call it inside `setup` or `kubb:plugin:setup`, or in code they await. Generators and later hooks run after setup and cannot use composables.

### KUBB_PARSER_FAILED: Parser failed {#kubb-parser-failed}

**Cause:** A parser crashed while printing a generated file.

**Fix:** Check the parser options. Report a bug to the parser's maintainers, as in [Crashes](#crashes).

### KUBB_PATH_TRAVERSAL: Path traversal {#kubb-path-traversal}

**Cause:** A resolved path escapes the output folder. Kubb refuses to write outside `output.path`, so a crafted spec or a wrong `group.name` cannot place files anywhere on disk.

**Fix:** Keep plugin `output.path`, `group.name`, and resolver `file.path` results inside the output folder, and strip `..` and path separators from names in the spec.

### KUBB_PLUGIN_FAILED: Plugin failed {#kubb-plugin-failed}

**Cause:** A plugin threw, or reported an error through `ctx.error`. The diagnostic names the plugin and keeps the thrown error as its cause.

**Fix:** Check the plugin options and the node at `at:`. Report a bug to the plugin's maintainers, as in [Crashes](#crashes). Plugin authors can raise a stable code with [`Diagnostics.Error` or `Diagnostics.report`](/docs/5.x/reference/kit/engine#diagnostics).

### KUBB_PLUGIN_NOT_FOUND: Plugin not found {#kubb-plugin-not-found}

**Cause:** A plugin requires another plugin that is not in the config. `kubb init --plugins` also reports it for an id the registry does not list.

**Fix:** Add the required plugin to `plugins`, in any order, or remove the plugin that needs it. Do not add `@kubb/plugin-oas`: in v5 the adapter reads OpenAPI.

### KUBB_POST_GENERATE_FAILED: Post-generate command failed {#kubb-post-generate-failed}

**Cause:** An [`output.postGenerate`](/docs/5.x/reference/configuration#outputpostgenerate) command exited with a non-zero status. The files are written, but the run fails.

**Fix:** Run the command from the project root to see the error, and check the binary and its spelling.

### KUBB_REF_NOT_FOUND: Reference not found {#kubb-ref-not-found}

**Cause:** A `$ref` points at a definition that does not exist, or at a file or URL Kubb cannot read. Inside an `x-` vendor extension it is only a warning, because Kubb never reads extensions.

Kubb also refuses some local files: any from a URL input, any outside the project and the input's folder on a Kubb Studio agent, and all of them on a sandbox agent. A managed agent reads only files in the repository of a git input.

**Fix:** Add the missing definition, create the file, or fix the `$ref`, then run [`kubb validate`](/docs/5.x/reference/commands/validate). For a refused file, move it inside the project, start your own agent with `--allow-file-refs`, or inline the schema.

### KUBB_UNKNOWN: Unknown error {#kubb-unknown}

**Cause:** An error without a Kubb code, such as a missing config file or a config that throws while loading. The terminal shows no docs link for it.

**Fix:** Read the message and the stack. Run `kubb generate --reporter file` for a log in `.kubb/`, or add `--verbose`. If it comes from a plugin or adapter, check its options. Otherwise report it with the message and the `Environment:` block.

## Warnings

### KUBB_ALIAS_CYCLE: Alias cycle {#kubb-alias-cycle}

**Cause:** Schemas that only `$ref` each other form a loop, so none has a shape to generate. Kubb types them as `unknown`.

**Fix:** Give one schema a real definition, or remove the `$ref` that closes the loop.

### KUBB_DUPLICATE_DISCRIMINATOR: Duplicate discriminator value {#kubb-duplicate-discriminator}

**Cause:** Two or more `oneOf` or `anyOf` members pin the `discriminator` property to one value, so it cannot pick a member. Zod's `z.discriminatedUnion` throws on the first parse of such a union.

**Fix:** Give each member its own discriminator value, or drop the `discriminator` so members match by shape.

### KUBB_INVALID_SPEC: Invalid spec {#kubb-invalid-spec}

**Cause:** The document fails OpenAPI schema validation. Kubb reports each problem and keeps generating, but the output can be incomplete or wrong. `@kubb/adapter-oas` checks while [`validate`](/extensions/kubb-labs/adapter-oas/options#validate) is `true`, the default. [`kubb validate`](/docs/5.x/reference/commands/validate) reports the code as an error and exits with code 1. The validator does not support OpenAPI 3.2 yet, so a 3.2 document gets this code with a message that it was not validated.

**Fix:** Fix each reported problem, or run `kubb validate` to list them all. Set `validate: false` on the adapter to skip the check.

### KUBB_PLUGIN_WARNING: Plugin warning {#kubb-plugin-warning}

**Cause:** A plugin reported a non-fatal problem through `ctx.warn`.

**Fix:** Read the message and adjust the input or the plugin options. Plugin authors can add a stable code and a location with `Diagnostics.report`.

### KUBB_UNSUPPORTED_FORMAT: Unsupported format {#kubb-unsupported-format}

**Cause:** Kubb maps no specific type to a schema's `format`, so the schema falls back to its base type. Kubb reports each format once, with a count, at the first schema that uses it.

**Fix:** Use a supported format, leave it out, or handle it in a custom parser or plugin.

## Info

### KUBB_DEPRECATED: Deprecated {#kubb-deprecated}

**Cause:** A schema or operation the spec uses is marked `deprecated`. Generation is unchanged.

**Fix:** Move off the deprecated definition when you can.

### KUBB_PERFORMANCE: Performance {#kubb-performance}

**Cause:** Kubb records one plugin's generation time, without config loading, formatting, linting, or post-generate commands. It is never printed as a problem. `--verbose` shows the timings, and the [JSON report](#machine-readable-output) lists them in `timings`.

**Fix:** None needed.

### KUBB_PLUGIN_INFO: Plugin info {#kubb-plugin-info}

**Cause:** A plugin reported a message through `ctx.info`. It shows in the summary and the JSON report.

**Fix:** None needed. Plugin authors can add a stable code and a location with `Diagnostics.report`.

### KUBB_UPDATE_AVAILABLE: Update available {#kubb-update-available}

**Cause:** npm has a newer Kubb than the one running. `kubb generate` asks npm at most once every 24 hours and keeps the answer in `KUBB_HOME` (default `~/.kubb`), so the notice also shows on runs that make no request. CI skips the check, detected from variables such as `CI` or `GITHUB_ACTIONS`.

**Fix:** Update Kubb and your plugins with your package manager.

## Machine-readable output

`kubb generate --reporter json` prints a JSON array to stdout, one report per config, so a single config still prints `[ ... ]`. CI and agents can read diagnostics from it without scraping the terminal.

```json [Report]
[
  {
    "name": "",
    "status": "failed",
    "plugins": { "passed": 2, "failed": ["plugin-zod"], "total": 3 },
    "counts": { "errors": 1, "warnings": 0, "infos": 0 },
    "filesCreated": 0,
    "filesUnchanged": 0,
    "dryRun": false,
    "durationMs": 312,
    "output": "/project/src/gen",
    "timings": [{ "plugin": "plugin-ts", "durationMs": 84 }],
    "diagnostics": [
      {
        "code": "KUBB_REF_NOT_FOUND",
        "severity": "error",
        "message": "Could not find a definition for #/components/schemas/Pet.",
        "title": "Reference not found",
        "cause": "A `$ref` could not be resolved in the source document.",
        "location": { "kind": "schema", "pointer": "#/components/schemas/Pet" },
        "help": "Add the schema under components.schemas, or fix the $ref. Run `kubb validate` to check the spec.",
        "plugin": "plugin-zod",
        "docsUrl": "https://kubb.dev/docs/5.x/reference/diagnostics#kubb-ref-not-found"
      }
    ]
  }
]
```

| Field | Holds |
| --- | --- |
| `name` | The config `name`, or `""` when unnamed |
| `counts` | Problem diagnostics by severity. Timing records do not count. |
| `timings` | Per-plugin durations, slowest first |
| `fileChanges` | Added, modified, and deleted files and lines, when the host collected them |
| `diagnostics[].title`, `.cause` | The catalog entry for the code, so an agent can act without opening this page |
| `diagnostics[].help` | The diagnostic's fix, or the catalog fix |
| `diagnostics[].plugin`, `.issues` | The plugin that reported it, and the issue tracker of a crashed extension |
| `diagnostics[].causes`, `.stack` | The messages of wrapped errors, and the root stack for a [crash](#crashes) |
| `diagnostics[].docsUrl` | This page's entry for the code. `KUBB_UNKNOWN` has none. |

The exit code stays the same: 1 on any error. See [`--reporter`](/docs/5.x/reference/commands/generate#reporters) for the other reporters.
