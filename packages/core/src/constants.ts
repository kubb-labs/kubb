/**
 * Number of file writes to batch in parallel during `flushPendingFiles`.
 */
export const STREAM_FLUSH_EVERY = 50

/**
 * Maximum number of █ characters in a plugin timing bar.
 */
export const SUMMARY_MAX_BAR_LENGTH = 10 as const

/**
 * Divides elapsed milliseconds into bar-length units (1 block per 100 ms).
 */
export const SUMMARY_TIME_SCALE_DIVISOR = 100 as const

/**
 * Upper bound of hook listeners a single plugin can add to one event (its schema, operation,
 * and operations generators, plus lifecycle hooks). Used to size the hooks emitter's
 * max-listener ceiling so a multi-generator plugin set does not trip Node's leak warning.
 */
export const HOOK_LISTENERS_PER_PLUGIN = 4

/**
 * Plugin `include` filter types that select operations directly. When one of these is set
 * without a `schemaName` include, the generate phase pre-scans operations to compute the set
 * of schemas they reach, so unreachable schemas can be pruned for that plugin.
 */
export const OPERATION_FILTER_TYPES: ReadonlySet<string> = new Set(['tag', 'operationId', 'path', 'method', 'contentType'])

/**
 * Stable codes Kubb attaches to a `Diagnostic`. Each maps to a known failure mode
 * and stays stable so it can be referenced in tooling and (later) docs. Reference
 * these instead of inlining the string at a throw site.
 */
export const diagnosticCode = {
  /**
   * Fallback for an unstructured error with no specific code.
   */
  unknown: 'KUBB_UNKNOWN',
  /**
   * The `input.path` file or URL could not be read.
   */
  inputNotFound: 'KUBB_INPUT_NOT_FOUND',
  /**
   * An adapter was configured without an `input`.
   */
  inputRequired: 'KUBB_INPUT_REQUIRED',
  /**
   * A `$ref` (or equivalent reference) could not be resolved in the source document.
   */
  refNotFound: 'KUBB_REF_NOT_FOUND',
  /**
   * A server variable value is not allowed by its `enum`.
   */
  invalidServerVariable: 'KUBB_INVALID_SERVER_VARIABLE',
  /**
   * A required plugin is missing from the config.
   */
  pluginNotFound: 'KUBB_PLUGIN_NOT_FOUND',
  /**
   * A plugin threw while generating.
   */
  pluginFailed: 'KUBB_PLUGIN_FAILED',
  /**
   * A plugin reported a non-fatal warning through `ctx.warn`.
   */
  pluginWarning: 'KUBB_PLUGIN_WARNING',
  /**
   * A plugin reported an informational message through `ctx.info`.
   */
  pluginInfo: 'KUBB_PLUGIN_INFO',
  /**
   * A schema uses a `format` Kubb does not map to a specific type. Reserved for
   * adapters to emit as a `warning`.
   */
  unsupportedFormat: 'KUBB_UNSUPPORTED_FORMAT',
  /**
   * A referenced schema or operation is marked `deprecated`. Reserved for adapters
   * to emit as an `info`.
   */
  deprecated: 'KUBB_DEPRECATED',
  /**
   * An adapter is required but the config has none. The build cannot read the input
   * without one.
   */
  adapterRequired: 'KUBB_ADAPTER_REQUIRED',
  /**
   * A resolved output path escapes the output directory, which can stem from a path
   * traversal in the spec or a misconfigured `group.name`.
   */
  pathTraversal: 'KUBB_PATH_TRAVERSAL',
  /**
   * A plugin's options are invalid, for example `output.mode: 'file'` paired with a `group` option.
   */
  invalidPluginOptions: 'KUBB_INVALID_PLUGIN_OPTIONS',
  /**
   * A post-generate shell hook (`hooks.done`) exited with a failure.
   */
  hookFailed: 'KUBB_HOOK_FAILED',
  /**
   * The formatter pass over the generated files failed.
   */
  formatFailed: 'KUBB_FORMAT_FAILED',
  /**
   * The linter pass over the generated files failed.
   */
  lintFailed: 'KUBB_LINT_FAILED',
  /**
   * Not a failure. Carries a plugin's elapsed time, summed into the run total.
   */
  performance: 'KUBB_PERFORMANCE',
  /**
   * Not a failure. A newer Kubb version is available on npm.
   */
  updateAvailable: 'KUBB_UPDATE_AVAILABLE',
} as const

/**
 * Union of the stable {@link diagnosticCode} values.
 */
export type DiagnosticCode = (typeof diagnosticCode)[keyof typeof diagnosticCode]
