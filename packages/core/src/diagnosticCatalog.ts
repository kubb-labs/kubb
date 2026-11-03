import type { ValueOf } from '@internals/utils'
/**
 * Every diagnostic code with its docs entry: a short title, what triggers it, and how to resolve
 * it. The source of truth for {@link diagnosticCode}, and the kubb.dev `/reference/diagnostics`
 * sections mirror it.
 */
export const diagnosticCatalog = {
  unknown: {
    code: 'KUBB_UNKNOWN',
    title: 'Unknown error',
    cause: 'An error was thrown without a stable Kubb code, so it is reported as-is.',
    fix: 'Read the underlying message and stack. If it comes from a plugin or adapter, check its configuration; otherwise report it as a possible Kubb bug.',
  },
  inputNotFound: {
    code: 'KUBB_INPUT_NOT_FOUND',
    title: 'Input not found',
    cause:
      'The file set as `input` (or passed as `kubb generate PATH`) could not be read. A URL reports `KUBB_INPUT_REQUEST_FAILED` or `KUBB_INPUT_UNREACHABLE` instead.',
    fix: 'Check that the path exists and is readable, then set it as `input` or pass it on the CLI.',
  },
  inputRequestFailed: {
    code: 'KUBB_INPUT_REQUEST_FAILED',
    title: 'Input request failed',
    cause: 'A URL set as `input` (or reached through a `$ref`) answered with a 4xx or 5xx status instead of the document.',
    fix: 'Open the URL to see what the server returns. A 401 or 403 needs credentials Kubb does not send, so download the document and point `input` at the local file. A 404 means the path is wrong, and a 5xx means the server itself failed.',
  },
  inputUnreachable: {
    code: 'KUBB_INPUT_UNREACHABLE',
    title: 'Input unreachable',
    cause:
      'A URL set as `input` (or reached through a `$ref`) never answered, so the request failed before a status came back. A refused connection, an unknown host, an expired certificate, and a timeout all land here.',
    fix: 'Check that the host is running and reachable from this machine. For a local server, start it and confirm the port matches the one in `input`.',
  },
  gitInputFailed: {
    code: 'KUBB_GIT_INPUT_FAILED',
    title: 'Git input failed',
    cause:
      'A git `input` (`git+<repo>#<ref>:<path>`) is malformed, or `git` could not fetch it: git is not installed, the repository or ref does not exist, or the credentials were refused.',
    fix: 'Write the input as `git+<repo>#<ref>:<path>`. Run `git fetch --depth 1 <repo> <ref>` yourself to see the git error, and set up a credential helper or SSH key for a private repository.',
  },
  inputRequired: {
    code: 'KUBB_INPUT_REQUIRED',
    title: 'Input required',
    cause: 'An adapter is configured but no `input` was provided.',
    fix: 'Set `input` to a file path, a URL, an inline spec (JSON/YAML string), or a parsed object in your Kubb config.',
  },
  legacyInput: {
    code: 'KUBB_LEGACY_INPUT',
    title: 'Legacy input shape',
    cause: '`input` is a `{ path }` or `{ data }` wrapper, which v4 used to point at a document and v5 reads as the document itself.',
    fix: 'Unwrap it: `input: { path: "./petStore.yaml" }` becomes `input: "./petStore.yaml"`, and `input: { data: spec }` becomes `input: spec`.',
  },
  invalidDocument: {
    code: 'KUBB_INVALID_DOCUMENT',
    title: 'Invalid document',
    cause:
      'The `input` cannot be read as an OpenAPI or Swagger document: its JSON or YAML has a syntax error, it declares no `openapi` or `swagger` version field, or its version cannot be upgraded to OpenAPI 3.1.',
    fix: 'Fix the syntax at the reported line, and check that `input` points at the spec and not an HTML page. Point `input` at a Swagger 2.0, OpenAPI 3.0, or OpenAPI 3.1 document, and check that a passed object is the spec itself rather than a wrapper around it.',
  },
  invalidSpec: {
    code: 'KUBB_INVALID_SPEC',
    title: 'Invalid spec',
    cause: 'The document does not pass OpenAPI schema validation. Kubb still generates from it, but the output can be incomplete or wrong.',
    fix: 'Fix the reported problem in the spec. Run `kubb validate` to list every error, or set `validate: false` on the adapter to skip the check.',
  },
  refNotFound: {
    code: 'KUBB_REF_NOT_FOUND',
    title: 'Reference not found',
    cause: 'A `$ref` could not be resolved in the source document.',
    fix: 'Add the missing definition (for example under `components.schemas`) or fix the `$ref`. Run `kubb validate` to check the spec.',
  },
  invalidServerVariable: {
    code: 'KUBB_INVALID_SERVER_VARIABLE',
    title: 'Invalid server variable',
    cause: 'A server variable value is not allowed by its `enum`.',
    fix: 'Use one of the values listed in the server variable `enum`, or update the spec.',
  },
  pluginNotFound: {
    code: 'KUBB_PLUGIN_NOT_FOUND',
    title: 'Plugin not found',
    cause: 'A plugin that another plugin depends on is missing from the config.',
    fix: 'Add the required plugin to the `plugins` array in kubb.config.ts, or remove the dependency on it.',
  },
  incompatibleExtension: {
    code: 'KUBB_INCOMPATIBLE_EXTENSION',
    title: 'Incompatible extension',
    cause: 'A plugin sets `meta.compatibility.kubb` or `meta.compatibility.node` to a range the running Kubb or Node.js version does not satisfy.',
    fix: 'Upgrade Kubb or Node.js to a version in the range, or install a version of the plugin that supports your current Kubb and Node.js.',
  },
  missingDependency: {
    code: 'KUBB_MISSING_DEPENDENCY',
    title: 'Missing dependency',
    cause: 'A plugin lists another plugin in its `dependencies` record without `optional: true`, and the config does not include it.',
    fix: 'Add the missing plugin to the `plugins` array in kubb.config.ts.',
  },
  incompatibleDependency: {
    code: 'KUBB_INCOMPATIBLE_DEPENDENCY',
    title: 'Incompatible dependency',
    cause: "A plugin's `dependencies` record sets a `version` range, and the configured plugin's `meta.version` falls outside it.",
    fix: 'Install a version of the dependency inside the range, or a version of the dependent plugin that supports the installed dependency.',
  },
  pluginFailed: {
    code: 'KUBB_PLUGIN_FAILED',
    title: 'Plugin failed',
    cause: 'A plugin threw while generating, or reported an error through `ctx.error`.',
    fix: 'Check the plugin options and the node at `at:`. If it is a bug, report it with the stack at `report:`.',
  },
  adapterFailed: {
    code: 'KUBB_ADAPTER_FAILED',
    title: 'Adapter failed',
    cause: 'The adapter threw an unexpected error while parsing the input.',
    fix: 'Check the input and the adapter options. If it is a bug, report it with the stack at `report:`.',
  },
  parserFailed: {
    code: 'KUBB_PARSER_FAILED',
    title: 'Parser failed',
    cause: 'A parser threw an unexpected error while printing a generated file.',
    fix: 'Check the parser options. If it is a bug, report it with the stack at `report:`.',
  },
  pluginWarning: {
    code: 'KUBB_PLUGIN_WARNING',
    title: 'Plugin warning',
    cause: 'A plugin reported a non-fatal warning through `ctx.warn`.',
    fix: 'Review the message. It does not fail the build; adjust the plugin options or input if the warning is unwanted.',
  },
  pluginInfo: {
    code: 'KUBB_PLUGIN_INFO',
    title: 'Plugin info',
    cause: 'A plugin reported an informational message through `ctx.info`.',
    fix: 'Informational only. No action is required.',
  },
  noContext: {
    code: 'KUBB_NO_CONTEXT',
    title: 'No plugin context',
    cause:
      'A `kubb/kit` composable such as `useKubb()` or `addGenerator()` ran outside the `setup` and `kubb:plugin:setup` of a plugin, so there is no plugin to apply it to.',
    fix: 'Call the composable inside `setup` or `kubb:plugin:setup`, including in code that setup awaits.',
  },
  unsupportedFormat: {
    code: 'KUBB_UNSUPPORTED_FORMAT',
    title: 'Unsupported format',
    cause: 'A schema uses a `format` Kubb does not map to a specific type, so it falls back to the base type.',
    fix: 'Use a format Kubb supports, or handle the custom format with a parser or plugin.',
  },
  aliasCycle: {
    code: 'KUBB_ALIAS_CYCLE',
    title: 'Alias cycle',
    cause: 'Schemas that only `$ref` each other form a loop, so none of them has a shape to generate. Kubb resolves them to `unknown`.',
    fix: 'Break the loop by giving one of the schemas a real definition, or remove the `$ref` that closes it.',
  },
  deprecated: {
    code: 'KUBB_DEPRECATED',
    title: 'Deprecated',
    cause: 'A referenced schema or operation is marked `deprecated`.',
    fix: 'Migrate off the deprecated definition if the warning is unwanted.',
  },
  adapterRequired: {
    code: 'KUBB_ADAPTER_REQUIRED',
    title: 'Adapter required',
    cause: 'An action needs an adapter but none is configured.',
    fix: 'Set `adapter` in kubb.config.ts, for example `adapterOas()`.',
  },
  pathTraversal: {
    code: 'KUBB_PATH_TRAVERSAL',
    title: 'Path traversal',
    cause: 'A resolved output path escaped the output directory, which can stem from a path traversal in the spec or a misconfigured `group.name`.',
    fix: 'Keep generated paths within the output directory. Review the `group.name` function and the names coming from the spec.',
  },
  cleanRoot: {
    code: 'KUBB_CLEAN_ROOT',
    title: 'Clean targets the project root',
    cause:
      '`output.clean` is enabled and `output.path` resolves to the project root or a parent of it, so cleaning would delete `kubb.config` and every source file.',
    fix: 'Point `output.path` at a subdirectory such as `./src/gen` so clean only removes generated code, or disable `output.clean`.',
  },
  invalidPluginOptions: {
    code: 'KUBB_INVALID_PLUGIN_OPTIONS',
    title: 'Invalid plugin options',
    cause: "A plugin was configured with options that cannot be honored, for example `output.mode: 'file'` paired with a `group` option.",
    fix: "Fix the plugin options. A single-file output has nothing to group, so remove the `group` option or use `output.mode: 'directory'`.",
  },
  postGenerateFailed: {
    code: 'KUBB_POST_GENERATE_FAILED',
    title: 'Post-generate command failed',
    cause: 'A post-generate command (`output.postGenerate`) exited with a non-zero status.',
    fix: 'Check the command is installed and correct, and run it manually to see the error.',
  },
  formatFailed: {
    code: 'KUBB_FORMAT_FAILED',
    title: 'Format failed',
    cause: 'The formatter pass over the generated files failed.',
    fix: 'Check the formatter (oxfmt, biome, or prettier) is installed and its config is valid, then run it manually on the output.',
  },
  lintFailed: {
    code: 'KUBB_LINT_FAILED',
    title: 'Lint failed',
    cause: 'The linter pass over the generated files failed.',
    fix: 'Check the linter (oxlint, biome, or eslint) is installed and its config is valid, then run it manually on the output.',
  },
  barrelDuplicateExport: {
    code: 'KUBB_BARREL_DUPLICATE_EXPORT',
    title: 'Duplicate barrel export',
    cause: 'Two generated modules export the same name, so the barrel cannot re-export both.',
    fix: 'Rename one of the colliding declarations, or configure the plugin resolver to produce distinct names.',
  },
  inlineFailed: {
    code: 'KUBB_INLINE_FAILED',
    title: 'Inline definition failed',
    cause: 'A file imports a name from a file whose sources are all inline, and that name could not be inlined.',
    fix: 'Give every name the file imports an inline definition, register a parser with inline support for its extension, or stop marking the source as inline.',
  },
  internalError: {
    code: 'KUBB_INTERNAL_ERROR',
    title: 'Internal error',
    cause: 'Kubb hit a state it does not expect. This is a bug in Kubb, not in your config.',
    fix: 'Rerun with `--reporter json` or `--verbose` to get the stack. Then report it at https://github.com/kubb-labs/kubb/issues with the spec and config that trigger it.',
  },
  performance: {
    code: 'KUBB_PERFORMANCE',
    title: 'Performance',
    cause: 'Not a failure. Records a plugin’s elapsed time, summed into the run total.',
    fix: 'No action. This is an informational metric.',
  },
  updateAvailable: {
    code: 'KUBB_UPDATE_AVAILABLE',
    title: 'Update available',
    cause: 'A newer Kubb version is published on npm than the one running.',
    fix: 'Update the `@kubb/*` packages, for example `npm install -g @kubb/cli`, to get the latest fixes.',
  },
} as const satisfies Record<string, { code: `KUBB_${string}`; title: string; cause: string; fix: string }>

/**
 * Stable codes Kubb attaches to a `Diagnostic`, derived from {@link diagnosticCatalog}. Reference
 * these instead of inlining the string at a throw site.
 */
export const diagnosticCode = Object.fromEntries(Object.entries(diagnosticCatalog).map(([key, { code }]) => [key, code])) as {
  readonly [K in keyof typeof diagnosticCatalog]: (typeof diagnosticCatalog)[K]['code']
}

/**
 * Union of the stable {@link diagnosticCode} values.
 */
export type DiagnosticCode = ValueOf<typeof diagnosticCode>
