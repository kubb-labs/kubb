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

Each Kubb diagnostic has a stable code, a message, a spec location, and a fix. Each code links to its entry here.

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

A terminal gets the first format. An AI agent, CI, or a pipe gets the second, with the reporting plugin in brackets after the code.

| Severity | Effect |
| --- | --- |
| Error | Fails the run. `kubb generate` exits with code 1. |
| Warning | Reported. The run continues. |
| Info | Advisory. Never fails the run. |

Rarer cases per code are in [Diagnostic details](/docs/5.x/topics/cli-runs#diagnostic-details).

## Crashes {#crashes}

`KUBB_ADAPTER_FAILED`, `KUBB_PARSER_FAILED`, `KUBB_PLUGIN_FAILED`, `KUBB_INTERNAL_ERROR`, and `KUBB_UNKNOWN` mark a crash. The agent format, `--verbose`, and `--reporter json` show its stack.

Report it with the stack and a spec fragment that reproduces it, at the `report:` link Kubb prints when the extension sets [`meta.issues`](/docs/5.x/reference/kit/extensions#meta).

## Errors

### KUBB_ADAPTER_FAILED {#kubb-adapter-failed}

The adapter crashed while parsing the input.

**Fix:** Check the input and adapter options, or [report the crash](#crashes).

### KUBB_ADAPTER_REQUIRED {#kubb-adapter-required}

`@kubb/plugin-redoc` runs without the OpenAPI adapter.

**Fix:** Set `adapter: adapterOas()` in `kubb.config.ts`.

### KUBB_BARREL_DUPLICATE_EXPORT {#kubb-barrel-duplicate-export}

Two files in one barrel folder export the same name.

**Fix:** Rename one declaration, change the [resolver](/docs/5.x/reference/plugin-options#resolver), or split the output folders.

### KUBB_CLEAN_ROOT {#kubb-clean-root}

`output.clean` would delete your source: `output.path` is the project root or a parent of it.

**Fix:** Point `output.path` at a generated folder such as `./src/gen`, or turn off `output.clean`.

### KUBB_FORMAT_FAILED {#kubb-format-failed}

The [`output.format`](/docs/5.x/reference/configuration#outputformat) tool failed. Kubb still writes the files.

**Fix:** Run the formatter on the output folder to see the error.

### KUBB_GIT_INPUT_FAILED {#kubb-git-input-failed}

A [git `input`](/docs/5.x/reference/configuration#input) is malformed, or `git` could not fetch it.

**Fix:** Use `git+<repo>#<ref>:<path>`, and run `git fetch --depth 1 <repo> <ref>` to see the git error.

### KUBB_INCOMPATIBLE_DEPENDENCY {#kubb-incompatible-dependency}

A configured plugin's `meta.version` is outside the `version` range in another plugin's `dependencies`.

**Fix:** Install a version of either plugin that fits the range.

### KUBB_INCOMPATIBLE_EXTENSION {#kubb-incompatible-extension}

An extension's `meta.compatibility.kubb` or `.node` range excludes the running version.

**Fix:** Upgrade Kubb or Node.js into the range, or install an extension version that supports yours.

### KUBB_INLINE_FAILED {#kubb-inline-failed}

Kubb cannot inline a name imported from an all-inline file, so it skips that file.

**Fix:** Add an inline definition, register a parser with inline support, or stop marking the source as inline.

### KUBB_INPUT_NOT_FOUND {#kubb-input-not-found}

Kubb cannot read the `input` file or the `kubb generate <path>` path.

**Fix:** Check that the file exists and is readable. Relative paths resolve against [`root`](/docs/5.x/reference/configuration#root).

### KUBB_INPUT_REQUEST_FAILED {#kubb-input-request-failed}

A URL `input` or `$ref` answered with a 4xx or 5xx status.

**Fix:** Open the URL to see the answer. For a 401 or 403, use a local copy: Kubb sends no credentials.

### KUBB_INPUT_REQUIRED {#kubb-input-required}

An adapter is set, but `input` is empty.

**Fix:** Set [`input`](/docs/5.x/reference/configuration#input).

### KUBB_INPUT_UNREACHABLE {#kubb-input-unreachable}

A URL `input`, a `$ref` URL, or the registry never answered.

**Fix:** Check that the host is up and reachable from this machine, through any VPN or proxy.

### KUBB_INTERNAL_ERROR {#kubb-internal-error}

A bug in Kubb.

**Fix:** Rerun with `--verbose` for the stack, then [open an issue](https://github.com/kubb-labs/kubb/issues) with the spec and config.

### KUBB_INVALID_DOCUMENT {#kubb-invalid-document}

The `input` has a syntax error, no `openapi` or `swagger` version, or a version Kubb cannot upgrade to OpenAPI 3.1.

**Fix:** Fix the syntax at the reported line, and point `input` at a Swagger 2.0 or OpenAPI 3.0 to 3.2 spec.

### KUBB_INVALID_PLUGIN_OPTIONS {#kubb-invalid-plugin-options}

A plugin's options cannot work as given, such as `group` or `sdk.mode: 'tag'` with file output. The message names the case.

**Fix:** Change what the message names. See [every case](/docs/5.x/topics/cli-runs#invalid-plugin-options).

### KUBB_INVALID_SERVER_VARIABLE {#kubb-invalid-server-variable}

A server variable resolves to a value outside its `enum`.

**Fix:** Pick an `enum` value in the adapter's `server.variables`, or fix the spec's `default` or `enum`.

### KUBB_LEGACY_INPUT {#kubb-legacy-input}

`input` is a v4 `{ path }` or `{ data }` wrapper.

**Fix:** Pass the value directly, such as `input: './petStore.yaml'` or `input: spec`.

### KUBB_LINT_FAILED {#kubb-lint-failed}

The [`output.lint`](/docs/5.x/reference/configuration#outputlint) tool failed. Kubb still writes the files.

**Fix:** Run the linter on the output folder, and relax its rules for generated files.

### KUBB_MISSING_DEPENDENCY {#kubb-missing-dependency}

A plugin lists another in `dependencies` without `optional: true`, and the config lacks it.

**Fix:** Install that plugin and add it to `plugins`.

### KUBB_NO_CONTEXT {#kubb-no-context}

A `kubb/kit` composable such as `useKubb()` ran outside `setup` and `kubb:plugin:setup`.

**Fix:** Call it inside `setup` or `kubb:plugin:setup`, or in code they await. Generators and later hooks cannot use composables.

### KUBB_PARSER_FAILED {#kubb-parser-failed}

A parser crashed while printing a generated file.

**Fix:** Check the parser options, then [report the crash](#crashes).

### KUBB_PATH_TRAVERSAL {#kubb-path-traversal}

A resolved path escapes `output.path`, so Kubb refuses to write it.

**Fix:** Keep `output.path`, `group.name`, and resolver `file.path` results inside the output folder. Strip `..` and separators from spec names.

### KUBB_PLUGIN_FAILED {#kubb-plugin-failed}

A plugin threw, or reported an error through `ctx.error`.

**Fix:** Check the plugin options and the node at `at:`, then [report the crash](#crashes).

### KUBB_PLUGIN_NOT_FOUND {#kubb-plugin-not-found}

A plugin requires another that is not in the config.

**Fix:** Add it to `plugins` in any order, or remove the plugin that needs it. Do not add `@kubb/plugin-oas`: in v5 the adapter reads OpenAPI.

### KUBB_POST_GENERATE_FAILED {#kubb-post-generate-failed}

An [`output.postGenerate`](/docs/5.x/reference/configuration#outputpostgenerate) command exited non-zero. Kubb still writes the files.

**Fix:** Run the command from the project root to see the error.

### KUBB_REF_NOT_FOUND {#kubb-ref-not-found}

A `$ref` points at a missing definition, or a file or URL Kubb cannot read.

**Fix:** Add the definition or file, or fix the `$ref`, then run [`kubb validate`](/docs/5.x/reference/commands/validate).

### KUBB_UNKNOWN {#kubb-unknown}

An error without a Kubb code, such as a missing or failing config file.

**Fix:** Read the message and the `--verbose` stack. Check the options of the plugin or adapter that threw it, or report it with the `Environment:` block.

## Warnings

### KUBB_ALIAS_CYCLE {#kubb-alias-cycle}

Schemas that only `$ref` each other form a loop, so Kubb types them as `unknown`.

**Fix:** Give one schema a real definition, or remove the `$ref` that closes the loop.

### KUBB_DUPLICATE_DISCRIMINATOR {#kubb-duplicate-discriminator}

`oneOf` or `anyOf` members share a `discriminator` value, so it cannot pick a member.

**Fix:** Give each member its own value, or drop the `discriminator` to match by shape.

### KUBB_INVALID_SPEC {#kubb-invalid-spec}

The document fails OpenAPI schema validation, so the output can be incomplete or wrong.

**Fix:** Run [`kubb validate`](/docs/5.x/reference/commands/validate) to list every problem, or set [`validate: false`](/extensions/kubb-labs/adapter-oas/options#validate) on the adapter to skip the check.

### KUBB_PLUGIN_WARNING {#kubb-plugin-warning}

A plugin reported a non-fatal problem through `ctx.warn`.

**Fix:** Read the message and adjust the input or the plugin options.

### KUBB_UNSUPPORTED_FORMAT {#kubb-unsupported-format}

Kubb has no type for a schema's `format`, so it uses the base type.

**Fix:** Use a supported format, drop it, or handle it in a custom parser or plugin.

## Info

### KUBB_DEPRECATED {#kubb-deprecated}

The spec uses a schema or operation marked `deprecated`. Generation is unchanged.

**Fix:** Move off the deprecated definition when you can.

### KUBB_PERFORMANCE {#kubb-performance}

One plugin's generation time, shown with `--verbose` and in the [JSON report](#machine-readable-output) `timings`.

**Fix:** None needed.

### KUBB_PLUGIN_INFO {#kubb-plugin-info}

A plugin reported a message through `ctx.info`, shown in the summary and JSON report.

**Fix:** None needed.

### KUBB_UPDATE_AVAILABLE {#kubb-update-available}

npm has a newer Kubb than the one running. See [Update check](/docs/5.x/topics/cli-runs#update-check).

**Fix:** Update Kubb and your plugins.

## Machine-readable output

`kubb generate --reporter json` prints a JSON array to stdout, one report per config, even for a single config.

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
| `name` | The config `name`, or `""` |
| `counts` | Diagnostics by severity, without timings |
| `timings` | Per-plugin durations, slowest first |
| `fileChanges` | File and line changes, when collected |
| `diagnostics[].title`, `.cause` | The code's catalog entry |
| `diagnostics[].help` | Its own fix, or the catalog fix |
| `diagnostics[].plugin`, `.issues` | The reporting plugin, and a crashed extension's issue tracker |
| `diagnostics[].causes`, `.stack` | Wrapped error messages, and a [crash](#crashes) stack |
| `diagnostics[].docsUrl` | This page's entry. `KUBB_UNKNOWN` has none. |

Any error still exits with code 1. See [`--reporter`](/docs/5.x/reference/commands/generate#reporters) for other reporters.
