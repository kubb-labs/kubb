---
layout: doc
title: Diagnostics - Kubb error codes and fixes
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

A terminal gets the first format. An AI agent, CI, or a pipe gets the second: plain labeled rows, with the reporting plugin in brackets after the code.

| Severity | Effect |
| --- | --- |
| Error | Fails the run. `kubb generate` exits with code 1. |
| Warning | Reported. The run continues. |
| Info | Advisory. Never fails the run. |

## Crashes {#crashes}

`KUBB_ADAPTER_FAILED`, `KUBB_PARSER_FAILED`, `KUBB_PLUGIN_FAILED`, `KUBB_INTERNAL_ERROR`, and `KUBB_UNKNOWN` mark a crash. The stack shows in the first `stack:` frames of the agent format, in the terminal with `--verbose`, and in the `stack` field of `--reporter json`.

Report the crash at the `report:` link with the stack and a spec fragment that reproduces it. Kubb prints the link when the extension sets [`meta.issues`](/docs/5.x/reference/kit/extensions#meta).

## Errors

### KUBB_ADAPTER_FAILED {#kubb-adapter-failed}

The adapter crashed while parsing the input.

**Fix:** Check the input and the adapter options. Report a bug as in [Crashes](#crashes).

### KUBB_ADAPTER_REQUIRED {#kubb-adapter-required}

`@kubb/plugin-redoc` runs without the OpenAPI adapter: the config sets a custom adapter, or `createKubb` from `@kubb/core` runs with none.

**Fix:** Set `adapter: adapterOas()` in `kubb.config.ts`.

### KUBB_BARREL_DUPLICATE_EXPORT {#kubb-barrel-duplicate-export}

Two files in one barrel folder export the same name. A type and a value may share a name.

**Fix:** Rename one declaration, change the [resolver](/docs/5.x/reference/plugin-options#resolver), or give the plugins separate output folders.

### KUBB_CLEAN_ROOT {#kubb-clean-root}

`output.clean` is on and `output.path` is the project root or a parent of it, so cleaning would delete `kubb.config` and your source files.

**Fix:** Point `output.path` at a generated folder such as `./src/gen`, or turn off `output.clean`.

### KUBB_FORMAT_FAILED {#kubb-format-failed}

The [`output.format`](/docs/5.x/reference/configuration#outputformat) tool failed. Kubb writes the files, but the run fails.

**Fix:** Run the formatter on the output folder to see the error, and check its install and config.

### KUBB_GIT_INPUT_FAILED {#kubb-git-input-failed}

A [git `input`](/docs/5.x/reference/configuration#input) is malformed, or `git` could not fetch it: git is missing, the repository or ref does not exist, or the credentials were refused.

**Fix:** Write the input as `git+<repo>#<ref>:<path>`. Run `git fetch --depth 1 <repo> <ref>` to see the git error, and set up a credential helper or SSH key for a private repository.

### KUBB_INCOMPATIBLE_DEPENDENCY {#kubb-incompatible-dependency}

A plugin's `dependencies` record sets a `version` range, and the configured plugin's `meta.version` is outside it.

**Fix:** Install a version of the dependency inside the range, or a version of the dependent plugin that supports it.

### KUBB_INCOMPATIBLE_EXTENSION {#kubb-incompatible-extension}

An extension's `meta.compatibility.kubb` or `meta.compatibility.node` range excludes the running version, at run time or in `kubb add`.

**Fix:** Upgrade Kubb or Node.js into the range, or install a version of the extension that supports yours.

### KUBB_INLINE_FAILED {#kubb-inline-failed}

A name imported from a file whose sources are all inline has no inline definition, refers to itself, or has no parser that supports inlining. Kubb skips writing that file.

**Fix:** Give the name an inline definition, register a parser with inline support for the extension, or stop marking the source as inline.

### KUBB_INPUT_NOT_FOUND {#kubb-input-not-found}

Kubb cannot read the `input` file, or the path passed to `kubb generate <path>`.

**Fix:** Check that the file exists and is readable. A relative path resolves against [`root`](/docs/5.x/reference/configuration#root).

### KUBB_INPUT_REQUEST_FAILED {#kubb-input-request-failed}

A URL `input` or `$ref` answered with a 4xx or 5xx status. The extension commands also report it for an invalid [registry](/docs/5.x/reference/registry) index.

**Fix:** Open the URL to see the answer. Kubb sends no credentials, so for a 401 or 403, download the document and use the local file.

### KUBB_INPUT_REQUIRED {#kubb-input-required}

An adapter is configured, but `input` is empty.

**Fix:** Set `input` to a file path, a URL, a git input, inline JSON or YAML, or a parsed object.

### KUBB_INPUT_UNREACHABLE {#kubb-input-unreachable}

A URL `input`, a `$ref` URL, or the registry never answered: a refused connection, an unknown host, an expired certificate, or a timeout.

**Fix:** Check that the host is up and reachable from this machine, through any VPN or proxy. For a local server, check the port.

### KUBB_INTERNAL_ERROR {#kubb-internal-error}

A bug in Kubb, not in your config or spec.

**Fix:** Rerun with `--reporter json` or `--verbose` to get the stack, then [open an issue](https://github.com/kubb-labs/kubb/issues) with the spec and config that trigger it.

### KUBB_INVALID_DOCUMENT {#kubb-invalid-document}

The `input` has a JSON or YAML syntax error, declares no `openapi` or `swagger` version, or has a version Kubb cannot upgrade to OpenAPI 3.1. The check runs even with validation off.

**Fix:** Fix the syntax at the reported line. Check that `input` is a Swagger 2.0 or OpenAPI 3.0, 3.1, or 3.2 spec, not an HTML page or a wrapper object.

### KUBB_INVALID_PLUGIN_OPTIONS {#kubb-invalid-plugin-options}

The `plugins` array or a plugin's options cannot work as given. The message names the case:

- `group` with file output: `output.mode: 'file'`, or an `output.path` with an extension.
- `sdk.mode: 'tag'` with file output on `@kubb/plugin-fetch`, `@kubb/plugin-axios`, or `@kubb/plugin-client`.
- An option value the plugin does not accept.
- A `plugins` entry that is not a plugin, such as `pluginTs` instead of `pluginTs()`.
- The same plugin twice, or a cycle in plugin `dependencies`.
- An extension without `meta.name` or `name`.
- A `@kubb/plugin-faker` `dateParser` that cannot format the adapter's `dateType: 'date'` values.

**Fix:** Change what the message names. A single file has nothing to group or split, so remove `group`, use `sdk.mode: 'flat'`, or write to a directory.

### KUBB_INVALID_SERVER_VARIABLE {#kubb-invalid-server-variable}

A server variable resolves to a value outside its `enum`, from the adapter's `server.variables` option or the variable's `default`.

**Fix:** Use a value from the `enum`, or fix the `default` or the `enum` in the spec.

### KUBB_LEGACY_INPUT {#kubb-legacy-input}

`input` is a v4 `{ path }` or `{ data }` wrapper. v5 takes the value directly.

**Fix:** Replace `input: { path: './petStore.yaml' }` with `input: './petStore.yaml'`, and `input: { data: spec }` with `input: spec`.

### KUBB_LINT_FAILED {#kubb-lint-failed}

The [`output.lint`](/docs/5.x/reference/configuration#outputlint) tool failed. Kubb writes the files, but the run fails.

**Fix:** Run the linter on the output folder to see the error, and relax its rules for generated files.

### KUBB_MISSING_DEPENDENCY {#kubb-missing-dependency}

A plugin lists another plugin in its `dependencies` record without `optional: true`, and the config does not include it.

**Fix:** Install the missing plugin and add it to `plugins` in `kubb.config.ts`.

### KUBB_NO_CONTEXT {#kubb-no-context}

A `kubb/kit` composable such as `useKubb()` or `addGenerator()` ran outside `setup` and `kubb:plugin:setup`.

**Fix:** Call it inside `setup` or `kubb:plugin:setup`, or in code they await. Generators and later hooks cannot use composables.

### KUBB_PARSER_FAILED {#kubb-parser-failed}

A parser crashed while printing a generated file.

**Fix:** Check the parser options. Report a bug as in [Crashes](#crashes).

### KUBB_PATH_TRAVERSAL {#kubb-path-traversal}

A resolved path escapes `output.path`. Kubb refuses to write it, so a crafted spec or a wrong `group.name` cannot place files elsewhere on disk.

**Fix:** Keep plugin `output.path`, `group.name`, and resolver `file.path` results inside the output folder, and strip `..` and path separators from names in the spec.

### KUBB_PLUGIN_FAILED {#kubb-plugin-failed}

A plugin threw, or reported an error through `ctx.error`.

**Fix:** Check the plugin options and the node at `at:`, and report a bug as in [Crashes](#crashes). Plugin authors can raise a stable code with [`Diagnostics.Error` or `Diagnostics.report`](/docs/5.x/reference/kit/engine#diagnostics).

### KUBB_PLUGIN_NOT_FOUND {#kubb-plugin-not-found}

A plugin requires another plugin that is not in the config. `kubb init --plugins` also reports it for an id the registry does not list.

**Fix:** Add the required plugin to `plugins`, in any order, or remove the plugin that needs it. Do not add `@kubb/plugin-oas`: in v5 the adapter reads OpenAPI.

### KUBB_POST_GENERATE_FAILED {#kubb-post-generate-failed}

An [`output.postGenerate`](/docs/5.x/reference/configuration#outputpostgenerate) command exited with a non-zero status. Kubb writes the files, but the run fails.

**Fix:** Run the command from the project root to see the error.

### KUBB_REF_NOT_FOUND {#kubb-ref-not-found}

A `$ref` points at a definition that does not exist, or at a file or URL Kubb cannot read. Inside an `x-` vendor extension it is only a warning.

**Fix:** Add the missing definition, create the file, or fix the `$ref`, then run [`kubb validate`](/docs/5.x/reference/commands/validate).

Kubb refuses some local `$ref` files, such as any from a URL input. See [External `$ref` files](/docs/5.x/topics/config-and-inputs#external-refs) for the rules on Kubb Studio agents.

### KUBB_UNKNOWN {#kubb-unknown}

An error without a Kubb code, such as a missing config file or a config that throws while loading.

**Fix:** Read the message and the stack (`--verbose`, or `--reporter file` for a log in `.kubb/`). If a plugin or adapter threw it, check its options. Otherwise report it with the `Environment:` block.

## Warnings

### KUBB_ALIAS_CYCLE {#kubb-alias-cycle}

Schemas that only `$ref` each other form a loop, so none has a shape to generate. Kubb types them as `unknown`.

**Fix:** Give one schema a real definition, or remove the `$ref` that closes the loop.

### KUBB_DUPLICATE_DISCRIMINATOR {#kubb-duplicate-discriminator}

Two or more `oneOf` or `anyOf` members pin the `discriminator` property to one value, so it cannot pick a member. Zod's `z.discriminatedUnion` throws on the first parse of such a union.

**Fix:** Give each member its own discriminator value, or drop the `discriminator` so members match by shape.

### KUBB_INVALID_SPEC {#kubb-invalid-spec}

The document fails OpenAPI schema validation, or is OpenAPI 3.2, which the validator does not support yet. Kubb keeps generating, but the output can be incomplete or wrong.

**Fix:** Fix each reported problem. [`kubb validate`](/docs/5.x/reference/commands/validate) lists them all as errors and exits with code 1. Set [`validate: false`](/extensions/kubb-labs/adapter-oas/options#validate) on the adapter to skip the check.

### KUBB_PLUGIN_WARNING {#kubb-plugin-warning}

A plugin reported a non-fatal problem through `ctx.warn`.

**Fix:** Read the message and adjust the input or the plugin options.

### KUBB_UNSUPPORTED_FORMAT {#kubb-unsupported-format}

Kubb maps no specific type to a schema's `format`, so the schema falls back to its base type. Kubb reports each format once, with a count.

**Fix:** Use a supported format, leave it out, or handle it in a custom parser or plugin.

## Info

### KUBB_DEPRECATED {#kubb-deprecated}

A schema or operation the spec uses is marked `deprecated`. Generation is unchanged.

**Fix:** Move off the deprecated definition when you can.

### KUBB_PERFORMANCE {#kubb-performance}

One plugin's generation time, without config loading, format, lint, or post-generate. `--verbose` and the [JSON report](#machine-readable-output) `timings` show it.

**Fix:** None needed.

### KUBB_PLUGIN_INFO {#kubb-plugin-info}

A plugin reported a message through `ctx.info`. It shows in the summary and the JSON report.

**Fix:** None needed.

### KUBB_UPDATE_AVAILABLE {#kubb-update-available}

npm has a newer Kubb than the one running. `kubb generate` checks at most once every 24 hours and skips the check in CI.

**Fix:** Update Kubb and your plugins with your package manager.

## Machine-readable output

`kubb generate --reporter json` prints a JSON array to stdout with one report per config. A single config still prints an array.

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
| `counts` | Problem diagnostics by severity, without timing records |
| `timings` | Per-plugin durations, slowest first |
| `fileChanges` | Added, modified, and deleted files and lines, when the host collected them |
| `diagnostics[].title`, `.cause` | The catalog entry for the code |
| `diagnostics[].help` | The diagnostic's fix, or the catalog fix |
| `diagnostics[].plugin`, `.issues` | The plugin that reported it, and the issue tracker of a crashed extension |
| `diagnostics[].causes`, `.stack` | The messages of wrapped errors, and the root stack for a [crash](#crashes) |
| `diagnostics[].docsUrl` | This page's entry for the code. `KUBB_UNKNOWN` has none. |

The exit code stays 1 on any error. See [`--reporter`](/docs/5.x/reference/commands/generate#reporters) for the other reporters.
