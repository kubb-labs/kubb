import { type DiagnosticCode, diagnosticCode } from './constants.ts'

/**
 * A human-readable explanation of a diagnostic code: a short title, what triggers it, and how
 * to resolve it. This is the single source of truth the kubb.dev `/diagnostics/<slug>` pages
 * mirror, so every code stays documented in one place. Typed as a total record over
 * {@link DiagnosticCode}, so adding a code without documenting it fails the build.
 */
export type DiagnosticDoc = {
  /**
   * Short title shown as the docs heading.
   */
  title: string
  /**
   * What triggers the diagnostic.
   */
  cause: string
  /**
   * The action that resolves it.
   */
  fix: string
}

/**
 * Explanation for every {@link diagnosticCode}. Use {@link Diagnostics.explain} to look one up
 * and `Diagnostics.docsUrl` for the matching kubb.dev page.
 */
export const diagnosticCatalog: Record<DiagnosticCode, DiagnosticDoc> = {
  [diagnosticCode.unknown]: {
    title: 'Unknown error',
    cause: 'An error was thrown without a stable Kubb code, so it is reported as-is.',
    fix: 'Read the underlying message and stack. If it comes from a plugin or adapter, check its configuration; otherwise report it as a possible Kubb bug.',
  },
  [diagnosticCode.inputNotFound]: {
    title: 'Input not found',
    cause: 'The file or URL set in `input.path` (or passed as `kubb generate PATH`) could not be read.',
    fix: 'Check that the path or URL exists and is readable, then set it in `input.path` or pass it on the CLI.',
  },
  [diagnosticCode.inputRequired]: {
    title: 'Input required',
    cause: 'An adapter is configured but no `input` was provided.',
    fix: 'Set `input.path` (a file or URL) or `input.data` (an inline spec) in your Kubb config.',
  },
  [diagnosticCode.refNotFound]: {
    title: 'Reference not found',
    cause: 'A `$ref` could not be resolved in the source document.',
    fix: 'Add the missing definition (for example under `components.schemas`) or fix the `$ref`. Run `kubb validate` to check the spec.',
  },
  [diagnosticCode.invalidServerVariable]: {
    title: 'Invalid server variable',
    cause: 'A server variable value is not allowed by its `enum`.',
    fix: 'Use one of the values listed in the server variable `enum`, or update the spec.',
  },
  [diagnosticCode.pluginNotFound]: {
    title: 'Plugin not found',
    cause: 'A plugin that another plugin depends on is missing from the config.',
    fix: 'Add the required plugin to the `plugins` array in kubb.config.ts, or remove the dependency on it.',
  },
  [diagnosticCode.pluginFailed]: {
    title: 'Plugin failed',
    cause: 'A plugin threw while generating, or reported an error through `ctx.error`.',
    fix: 'Read the underlying error and check the plugin options and the schema or operation it failed on.',
  },
  [diagnosticCode.pluginWarning]: {
    title: 'Plugin warning',
    cause: 'A plugin reported a non-fatal warning through `ctx.warn`.',
    fix: 'Review the message. It does not fail the build; adjust the plugin options or input if the warning is unwanted.',
  },
  [diagnosticCode.pluginInfo]: {
    title: 'Plugin info',
    cause: 'A plugin reported an informational message through `ctx.info`.',
    fix: 'Informational only. No action is required.',
  },
  [diagnosticCode.unsupportedFormat]: {
    title: 'Unsupported format',
    cause: 'A schema uses a `format` Kubb does not map to a specific type, so it falls back to the base type.',
    fix: 'Use a format Kubb supports, or handle the custom format with a parser or plugin. Enable it with `adapterOas({ diagnostics: { unsupportedFormat: true } })`.',
  },
  [diagnosticCode.deprecated]: {
    title: 'Deprecated',
    cause: 'A referenced schema or operation is marked `deprecated`.',
    fix: 'Migrate off the deprecated definition, or silence it with `diagnostics.levels`. Enable it with `adapterOas({ diagnostics: { deprecated: true } })`.',
  },
  [diagnosticCode.adapterRequired]: {
    title: 'Adapter required',
    cause: 'An action needs an adapter (for example opening Kubb Studio) but none is configured.',
    fix: 'Set `adapter` in kubb.config.ts, for example `adapterOas()`.',
  },
  [diagnosticCode.devtoolsInvalid]: {
    title: 'Invalid devtools config',
    cause: 'The `devtools` config is set to something other than an object.',
    fix: 'Set `devtools` to an options object, or remove it to disable Kubb Studio.',
  },
  [diagnosticCode.pathTraversal]: {
    title: 'Path traversal',
    cause: 'A resolved output path escaped the output directory, which can stem from a path traversal in the spec or a misconfigured `group.name`.',
    fix: 'Keep generated paths within the output directory. Review the `group.name` function and the names coming from the spec.',
  },
  [diagnosticCode.hookFailed]: {
    title: 'Hook failed',
    cause: 'A post-generate shell hook (`hooks.done`) exited with a non-zero status.',
    fix: 'Check the command is installed and correct, and run it manually to see the error.',
  },
  [diagnosticCode.formatFailed]: {
    title: 'Format failed',
    cause: 'The formatter pass over the generated files failed.',
    fix: 'Check the formatter (oxfmt, biome, or prettier) is installed and its config is valid, then run it manually on the output.',
  },
  [diagnosticCode.lintFailed]: {
    title: 'Lint failed',
    cause: 'The linter pass over the generated files failed.',
    fix: 'Check the linter (oxlint, biome, or eslint) is installed and its config is valid, then run it manually on the output.',
  },
  [diagnosticCode.timing]: {
    title: 'Timing',
    cause: 'Not a failure. Records a plugin’s elapsed time for the run summary.',
    fix: 'No action. This is an informational metric.',
  },
}
