---
layout: doc
title: Diagnostics
description: Reference for Kubb's diagnostic codes, the stable codes Kubb prints
  when a build fails, with causes and fixes.
outline:
  - 2
  - 3
order: 7
navigation:
  title: Diagnostics
  icon: i-iconoir-warning-triangle
---

# Diagnostics

When a build fails, Kubb prints a diagnostic with a stable code, the message, the location in your
document, and a suggested fix. In a terminal, Kubb groups problems by plugin, with the code on the right and a link to its entry below:

```text [Terminal]
 plugin-ts

  ✖ Could not find #/components/schemas/Owner                    KUBB_REF_NOT_FOUND
    at   #/components/schemas/Pet/properties/owner
    fix  Add the missing definition under components.schemas, or fix the $ref.
    ↳ Learn more  kubb.dev/docs/5.x/reference/diagnostics#kubb-ref-not-found
```

When an AI coding agent, CI, or a pipe reads the output, Kubb prints plain labeled rows instead. The rows include the cause and fix from this page, so the output alone explains the problem. A crash adds `caused by:` and the first `stack:` frames:

```text [Agent]
error KUBB_REF_NOT_FOUND [plugin-ts]: Could not find #/components/schemas/Owner
  at: #/components/schemas/Pet/properties/owner
  why: A `$ref` could not be resolved in the source document.
  fix: Add the missing definition under components.schemas, or fix the $ref.
  docs: https://kubb.dev/docs/5.x/reference/diagnostics#kubb-ref-not-found

Kubb failed: 1 error (plugin-ts). Exit code 1.
Rerun with --reporter json for machine-readable diagnostics.
```

## Codes

Find the code printed by Kubb below. Each entry explains the cause and the fix.

## Errors

An error fails the run with a non-zero exit code.

### KUBB_ADAPTER_FAILED: Adapter failed {#kubb-adapter-failed}

The adapter threw an unexpected error while parsing the input. Errors the adapter reports on purpose, such as `KUBB_REF_NOT_FOUND`, keep their own code.

Check the input and the adapter options. If it is a bug, report it to the adapter's maintainers with the stack trace. Kubb prints the stack for this code, and `--reporter json` includes it as `stack`. When the adapter sets [`meta.issues`](/docs/5.x/reference/kit/extensions#meta), Kubb prints its issue tracker as a `report:` link.

### KUBB_ADAPTER_REQUIRED: Adapter required {#kubb-adapter-required}

An action needs an adapter but none is configured.

Set `adapter` in your config, for example `adapterOas()`. Standard `defineConfig` supplies the default OpenAPI adapter, so this catalog code is not currently emitted for an omitted adapter.

### KUBB_BARREL_DUPLICATE_EXPORT: Duplicate barrel export {#kubb-barrel-duplicate-export}

Two files in the same barrel directory export the same name. The barrel keeps the first export and drops the rest, so the generated code still parses, but the run is marked failed.

Rename the colliding declarations, change the resolver, or separate their output directories. A type and a value may share a name.

### KUBB_CLEAN_ROOT: Clean targets the project root {#kubb-clean-root}

`output.clean` removes generated code before a build. Kubb stops the build instead of wiping your project when `output.path` resolves to the project root or a parent of it, which would delete `kubb.config` and every source file.

Use a generated subdirectory such as `./src/gen`. Disable `output.clean` if it contains hand-written files. Kubb rejects cleaning the project root or a parent directory.

### KUBB_FORMAT_FAILED: Format failed {#kubb-format-failed}

The formatter pass over the generated files failed. Formatting runs after generation. The files are written, but the run is marked failed.

Check that the formatter is installed and its config is valid. Run it against the output directory to inspect the error, or change `output.format`.

### KUBB_INCOMPATIBLE_DEPENDENCY: Incompatible dependency {#kubb-incompatible-dependency}

A plugin's `dependencies` record sets a `version` range, and the configured plugin's `meta.version` falls outside it. Kubb skips the check when the dependency has no `meta.version`.

Install a version of the dependency inside the range, or a version of the dependent plugin that supports the installed dependency.

### KUBB_INCOMPATIBLE_EXTENSION: Incompatible extension {#kubb-incompatible-extension}

A plugin sets `meta.compatibility.kubb` or `meta.compatibility.node` to a range the running Kubb or Node.js version does not satisfy. Kubb checks this before any plugin runs.

Upgrade Kubb or Node.js to a version in the range, or install a version of the plugin that supports your current Kubb and Node.js.

### KUBB_GIT_INPUT_FAILED: Git input failed {#kubb-git-input-failed}

A git `input` (`git+<repo>#<ref>:<path>`) is malformed, or `git` could not fetch it: git is not installed, the repository or ref does not exist, or the credentials were refused.

Write the input as `git+<repo>#<ref>:<path>`. Run `git fetch --depth 1 <repo> <ref>` yourself to see the git error, and set up a credential helper or SSH key for a private repository.

### KUBB_INLINE_FAILED: Inline definition failed {#kubb-inline-failed}

A file imports a name from a file whose sources are all inline, and Kubb could not replace that name. The name has no inline definition, its definition refers back to itself, or no parser for the file's extension supports inline sources. One diagnostic lists every such problem. The inline file is not written, so the run is marked failed.

Give every name the file imports an inline definition, register a parser with inline support for its extension, or stop marking the source as inline.

### KUBB_INPUT_NOT_FOUND: Input not found {#kubb-input-not-found}

The file set as `input` (or passed as `kubb generate PATH`) could not be read. The OpenAPI adapter checks the path before parsing, so the run stops here instead of failing later with a vague read error.

Check that the file exists and is readable. Use a path relative to `kubb.config.ts`, an absolute path, or a full URL for a remote spec.

### KUBB_INPUT_REQUEST_FAILED: Input request failed {#kubb-input-request-failed}

A URL set as `input` answered with a 4xx or 5xx status instead of the OpenAPI document. The server was reached, so either the URL is wrong or the endpoint refused to serve the document.

Fetch the URL with `curl` and confirm it serves the OpenAPI document. For a protected document, download it and use the local file. Check server logs for a 5xx response. This also applies to remote `$ref` requests.

### KUBB_INPUT_REQUIRED: Input required {#kubb-input-required}

An adapter is configured but no `input` was provided, so there is nothing to parse.

Set `input` to a file path, URL, inline JSON/YAML spec, or parsed document. If merging documents, provide at least one input.

### KUBB_INPUT_UNREACHABLE: Input unreachable {#kubb-input-unreachable}

A URL set as `input` never answered, so the request failed before a status came back.

Start the server and check its host and port. Fetch the URL from the machine running Kubb. Connect to any required VPN or proxy, or use a downloaded spec. The message includes the connection failure reason.

### KUBB_INTERNAL_ERROR: Internal error {#kubb-internal-error}

Kubb hit a state it does not expect. This is a bug in Kubb, not in your config or your spec.

Rerun with `--reporter json` or `--verbose` to get the stack. Then [open an issue](https://github.com/kubb-labs/kubb/issues) with the spec and config that trigger it.

### KUBB_INVALID_DOCUMENT: Invalid document {#kubb-invalid-document}

The document resolved from `input` cannot be read as an OpenAPI or Swagger document. Its JSON or YAML has a syntax error, it declares neither `openapi` nor `swagger`, or its version cannot be upgraded to OpenAPI 3.1.

Fix the syntax at the line the message reports, and check that `input` points at the spec and not an HTML page. Use a Swagger 2.0, OpenAPI 3.0, or OpenAPI 3.1 document, and pass the document itself rather than a wrapper. Missing versions fail even when validation is disabled.

### KUBB_INVALID_PLUGIN_OPTIONS: Invalid plugin options {#kubb-invalid-plugin-options}

A plugin was given options that cannot be honored together. The main case is `output.mode` resolving to `'file'` while a `group` option is also set, or, for `@kubb/plugin-fetch`/`@kubb/plugin-axios`, while `sdk.mode: 'tag'` is set. Both pair a single-file output with an option that only makes sense split across several files, so the build stops instead of producing a layout the options do not describe.

Single-file output cannot use `group` or `sdk.mode: 'tag'`. Remove grouping, use `sdk.mode: 'flat'`, or write to a directory. A file extension in `output.path` implies file mode unless you explicitly select directory mode.

### KUBB_INVALID_SERVER_VARIABLE: Invalid server variable {#kubb-invalid-server-variable}

A server variable resolves to a value that its `enum` does not allow.

Choose a variable value allowed by its `enum`, correct the default, or update the enum to match the server.

### KUBB_LEGACY_INPUT: Legacy input shape {#kubb-legacy-input}

`input` is a `{ path }` or `{ data }` wrapper. v4 used it to point at a document, and v5 takes the value directly.

Replace `input: { path: './spec.yaml' }` with `input: './spec.yaml'`, or `input: { data: spec }` with `input: spec`.

### KUBB_LINT_FAILED: Lint failed {#kubb-lint-failed}

The linter pass over the generated files failed. Linting runs after generation. The files are written, but the run is marked failed.

Check that the linter is installed and configured. Run it manually against the output. Adjust rules for generated files or change `output.lint`.

### KUBB_MISSING_DEPENDENCY: Missing dependency {#kubb-missing-dependency}

A plugin lists another plugin in its `dependencies` record without `optional: true`, and the config does not include it. A `dependencies` array only orders plugins and never raises this code.

Install the missing plugin and add it to `plugins` in `kubb.config.ts`.

### KUBB_NO_CONTEXT: No plugin context {#kubb-no-context}

A `kubb/kit` composable such as `useKubb()` or `addGenerator()` ran outside `setup` and `kubb:plugin:setup`. Composables read the context of the plugin being set up, so outside setup there is no plugin to apply them to. The message names the composable that was called.

Call the composable inside `setup` or `kubb:plugin:setup`. Code that setup awaits also works, because the context survives an `await`. Generators and later hooks run after setup, so they cannot use composables.

### KUBB_PARSER_FAILED: Parser failed {#kubb-parser-failed}

A parser threw an unexpected error while printing a generated file.

Check the parser options. If it is a bug, report it to the parser's maintainers with the stack trace. Kubb prints the stack for this code, and `--reporter json` includes it as `stack`. When the parser sets [`meta.issues`](/docs/5.x/reference/kit/extensions#meta), Kubb prints its issue tracker as a `report:` link.

### KUBB_PATH_TRAVERSAL: Path traversal {#kubb-path-traversal}

A resolved output path escaped the output directory. Kubb refuses to write outside `output.path`, so a crafted spec or a misconfigured `group.name` cannot drop files anywhere on disk.

Keep generated paths within `output.path` and resolver `file.path` overrides within the project root. Reject `..` and path separators in names from the spec or `group.name`.

### KUBB_PLUGIN_FAILED: Plugin failed {#kubb-plugin-failed}

A plugin threw while generating, or reported an error through `ctx.error`. The diagnostic is attributed to the plugin and fails the run.

Check the plugin options and the node at the `at:` pointer. If it is a bug, report it to the plugin's maintainers with the stack trace. Kubb prints the stack for this code, and `--reporter json` includes it as `stack`. When the plugin sets [`meta.issues`](/docs/5.x/reference/kit/extensions#meta), Kubb prints its issue tracker as a `report:` link. Include a spec fragment that reproduces it. The diagnostic preserves an underlying error as its cause. For structured errors, plugin authors can use [`Diagnostics.Error` or `Diagnostics.report`](/docs/5.x/reference/kit/engine#diagnostics).

### KUBB_PLUGIN_NOT_FOUND: Plugin not found {#kubb-plugin-not-found}

A plugin requires another plugin that is not in the config.

Install the required plugin and add it to `plugins`, or remove its dependent plugin. Order does not matter. The adapter reads OpenAPI in v5, so do not add `@kubb/plugin-oas`.

### KUBB_POST_GENERATE_FAILED: Post-generate command failed {#kubb-post-generate-failed}

A post-generate command (`output.postGenerate`) exited with a non-zero status. These commands run after generation. The files are written, but the run is marked failed.

Run the command manually from the project root. Check the binary, spelling, and configuration. These commands run after formatting and linting.

### KUBB_REF_NOT_FOUND: Reference not found {#kubb-ref-not-found}

A `$ref` points at a definition that does not exist in the document, or at a file or URL Kubb cannot read.

Add the missing definition, create the missing file, or correct the `$ref`. Run `kubb validate` before generation.

A `$ref` that Kubb cannot read inside an `x-` vendor extension is a warning, because Kubb never reads extensions and the output does not change.

### KUBB_UNKNOWN: Unknown error {#kubb-unknown}

A fallback for an error that does not yet carry a specific diagnostic code.

Run `kubb generate --reporter file` for a log under `.kubb/`, or use `--verbose`. Inspect the message and stack. Report unclear failures with the message and `Environment:` block. Unclassified errors have no suggested fix or docs URL in CLI output.

## Warnings

A warning is reported and the run continues.

### KUBB_INVALID_SPEC: Invalid spec {#kubb-invalid-spec}

The document does not pass OpenAPI schema validation. Kubb reports each problem and keeps generating, but the output can be incomplete or wrong. `@kubb/adapter-oas` checks this when [`validate`](/extensions/kubb-labs/adapter-oas/options#validate) is `true`, the default.

Fix the reported problem in the spec. Run [`kubb validate`](/docs/5.x/reference/commands/validate) to list every error with its location. Set `validate: false` on the adapter to skip the check.

### KUBB_PLUGIN_WARNING: Plugin warning {#kubb-plugin-warning}

A plugin reported a non-fatal warning through `ctx.warn`.

Read the message and adjust the input or plugin options as needed. Plugin authors can use `Diagnostics.report` for a stable code and source pointer.

### KUBB_UNSUPPORTED_FORMAT: Unsupported format {#kubb-unsupported-format}

A schema's `format` is not one Kubb maps to a specific type, so it falls back to the base type.

Use a supported format, omit it if the base type is sufficient, or map it through a custom parser or plugin.

### KUBB_ALIAS_CYCLE: Alias cycle {#kubb-alias-cycle}

Schemas that only `$ref` each other form a loop, so none of them has a shape to generate. Kubb resolves them to `unknown`.

Break the loop by giving one of the schemas a real definition, or remove the `$ref` that closes it.

## Info

An info diagnostic is advisory and never fails the run.

### KUBB_DEPRECATED: Deprecated {#kubb-deprecated}

A referenced schema or operation is marked `deprecated`.

Move away from the deprecated definition when possible. Generation continues unchanged, and the notice may recur on each run.

### KUBB_PERFORMANCE: Performance {#kubb-performance}

Records a plugin's elapsed time. Kubb collects one per plugin during a build.

This bookkeeping code is not printed as a terminal diagnostic. Run `kubb generate --verbose` to inspect plugin timings. The reported duration sums generation time and excludes config loading, formatting, linting, and post-generate hooks.

### KUBB_PLUGIN_INFO: Plugin info {#kubb-plugin-info}

A plugin reported an informational message through `ctx.info`.

No action is required. The plugin name and message appear in the summary and JSON report. Plugin authors can use `Diagnostics.report` for a stable code and source pointer.

### KUBB_UPDATE_AVAILABLE: Update available {#kubb-update-available}

A newer Kubb version is published on npm than the one running.

Update Kubb and your project plugins through your package manager.

## Machine-readable output

`kubb generate --reporter json` prints a stable report to stdout. The output is a JSON array with
one report per config, so a single-config run still prints `[ ... ]`. CI can read diagnostics
without scraping the terminal:

```json [Report]
[
  {
    "name": "",
    "status": "failed",
    "plugins": { "passed": 2, "failed": ["plugin-zod"], "total": 3 },
    "counts": { "errors": 1, "warnings": 0, "infos": 0 },
    "filesCreated": 0,
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
        "docsUrl": "https://kubb.dev/docs/5.x/reference/diagnostics#kubb-ref-not-found"
      }
    ]
  }
]
```

Each config emits one report. `counts` totals the `problem` diagnostics by severity. `timings` lists
per-plugin durations slowest first. `name` is the config name, empty when unnamed.

Each diagnostic carries the catalog `title` and `cause` for its code, so an agent can act on it
without opening this page. `help` falls back to the catalog fix when the diagnostic has none.
When the diagnostic wraps a thrown error, `causes` lists the messages of the underlying errors,
and a crash (`KUBB_UNKNOWN` or a `*_FAILED` extension code) adds the root `stack`.

The exit code is unchanged: non-zero on any error. See [`--reporter`](/docs/5.x/reference/commands/generate#reporters)
for the other reporters.
