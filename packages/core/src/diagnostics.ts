import { AsyncLocalStorage } from 'node:async_hooks'
import { getErrorMessage } from '@internals/utils'
import { version } from '../package.json'
import { type DiagnosticCode, diagnosticCode } from './constants.ts'

/**
 * Docs major, derived from the package version so the link tracks the published major.
 */
const docsMajor = version.split('.')[0] ?? '5'

/**
 * How serious a diagnostic is. `error` fails the build, `warning` and `info`
 * are reported but do not.
 */
export type DiagnosticSeverity = 'error' | 'warning' | 'info'

/**
 * Per-code severity overrides from `config.diagnostics.levels`. A code mapped to a
 * {@link DiagnosticSeverity} is re-leveled; a code mapped to `'off'` is dropped.
 * `timing` diagnostics are never affected.
 */
export type DiagnosticLevels = Partial<Record<DiagnosticCode, DiagnosticSeverity | 'off'>>

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
 * Points a diagnostic back into the source document. Inputs are parsed into an
 * object model with no line/column, so locations carry a JSON pointer the adapter
 * builds (the OAS adapter emits `#/components/schemas/Pet`). A `config` diagnostic
 * points at the Kubb config itself and so has no pointer.
 */
export type DiagnosticLocation =
  | {
      kind: 'schema'
      /**
       * RFC 6901 JSON pointer into the source document.
       */
      pointer: string
      /**
       * The original reference when the diagnostic stems from an unresolved one.
       */
      ref?: string
    }
  | {
      kind: 'operation' | 'document'
      /**
       * RFC 6901 JSON pointer into the source document.
       */
      pointer: string
    }
  | {
      kind: 'config'
    }

/**
 * What a diagnostic carries. `problem` is a build issue shown to the user;
 * `timing` records a plugin's elapsed time for the run summary and is not
 * rendered as a problem.
 */
export type DiagnosticKind = 'problem' | 'timing'

/**
 * A structured record collected during a build, gathered into the build result
 * instead of aborting on the first failure. A `problem` carries a stable
 * {@link DiagnosticCode}, a `severity`, a `message`, and an optional `location`
 * into the source document. A `timing` carries a plugin's `duration`.
 */
export type Diagnostic = {
  /**
   * @default 'problem'
   */
  kind?: DiagnosticKind
  /**
   * Stable identifier for the problem, from the {@link diagnosticCode} catalog.
   */
  code: DiagnosticCode
  severity: DiagnosticSeverity
  message: string
  location?: DiagnosticLocation
  /**
   * A suggested fix, phrased as an action the user can take.
   */
  help?: string
  /**
   * Name of the plugin or subsystem that produced the diagnostic.
   */
  plugin?: string
  /**
   * The underlying error, when the diagnostic wraps a thrown one.
   */
  cause?: Error
  /**
   * Elapsed milliseconds, set on `timing` diagnostics.
   */
  duration?: number
}

/**
 * A {@link Diagnostic} reduced to its JSON-safe fields plus a `docsUrl`, for
 * machine-readable output (the `--reporter json` report, the MCP tools). Drops the
 * non-serializable `cause` and the `timing`/`duration` bookkeeping.
 */
export type SerializedDiagnostic = {
  code: DiagnosticCode
  severity: DiagnosticSeverity
  message: string
  location?: DiagnosticLocation
  help?: string
  plugin?: string
  /**
   * The kubb.dev docs link for the code, omitted for the unknown fallback.
   */
  docsUrl?: string
}

/**
 * An `Error` that carries a {@link Diagnostic}, so structured problems can flow
 * through the existing throw/catch paths while keeping their code and location.
 *
 * @example
 * ```ts
 * throw new DiagnosticError({ code: diagnosticCode.refNotFound, severity: 'error', message: `Could not find ${ref}`, location: { kind: 'schema', pointer: ref, ref } })
 * ```
 */
export class DiagnosticError extends Error {
  diagnostic: Diagnostic

  constructor(diagnostic: Diagnostic) {
    super(diagnostic.message, { cause: diagnostic.cause })
    this.name = 'DiagnosticError'
    this.diagnostic = diagnostic
  }
}

/**
 * Structural check for a {@link DiagnosticError}, including one thrown from a duplicated
 * `@kubb/core` copy where `instanceof` fails. Matches on the `name` and a `diagnostic`
 * that carries a `code`.
 */
function isDiagnosticError(error: unknown): error is DiagnosticError {
  if (error instanceof DiagnosticError) {
    return true
  }
  return (
    error instanceof Error &&
    error.name === 'DiagnosticError' &&
    'diagnostic' in error &&
    typeof (error as { diagnostic?: unknown }).diagnostic === 'object' &&
    (error as { diagnostic?: Diagnostic }).diagnostic !== null &&
    typeof (error as { diagnostic?: { code?: unknown } }).diagnostic?.code === 'string'
  )
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

/**
 * Static helpers for working with {@link Diagnostic}s, plus the run-scoped sink
 * that lets deep code report a diagnostic without threading a callback.
 *
 * The sink lives in a single `AsyncLocalStorage` in the `@kubb/core` bundle.
 * `Diagnostics.scope` activates it for a run; anything inside that run — the
 * adapter parse, a lazily consumed stream, a generator — reports through
 * `Diagnostics.report`, and every report lands in the same run.
 */
export class Diagnostics {
  static #reporterStorage = new AsyncLocalStorage<(diagnostic: Diagnostic) => void>()

  /**
   * Runs `fn` with `sink` as the active diagnostic sink for the whole async
   * subtree, so {@link Diagnostics.report} reaches it from anywhere inside.
   */
  static scope<T>(sink: (diagnostic: Diagnostic) => void, fn: () => T): T {
    return Diagnostics.#reporterStorage.run(sink, fn)
  }

  /**
   * Reports a diagnostic into the active run without throwing. Returns `true` when
   * a run consumed it, `false` when called outside a run (so callers can fall back
   * to throwing). Use a `warning`/`info` severity for non-fatal issues.
   */
  static report(diagnostic: Diagnostic): boolean {
    const sink = Diagnostics.#reporterStorage.getStore()
    if (!sink) {
      return false
    }
    sink(diagnostic)
    return true
  }

  /**
   * Coerces any thrown value into a {@link Diagnostic}. A {@link DiagnosticError}
   * keeps its structured data; anything else becomes a `KUBB_UNKNOWN` error.
   */
  static from(error: unknown): Diagnostic {
    // The event emitter and BuildError wrap the original, so walk the cause chain to
    // recover a DiagnosticError thrown deeper down. `root` tracks the deepest error so
    // the unknown diagnostic reports the original message and stack, not the wrapper's.
    const seen = new Set<unknown>()
    let current: unknown = error
    let root: Error | undefined
    while (current instanceof Error && !seen.has(current)) {
      // Match structurally, not just by `instanceof`: a `DiagnosticError` thrown from a
      // duplicated `@kubb/core` copy (bundled into an adapter or plugin) is a different
      // class, but still carries the same `diagnostic`, so its code must survive.
      if (isDiagnosticError(current)) {
        return current.diagnostic
      }
      seen.add(current)
      root = current
      current = current.cause
    }

    return {
      code: diagnosticCode.unknown,
      severity: 'error',
      message: root ? root.message : getErrorMessage(error),
      cause: root,
    }
  }

  /**
   * Builds a `timing` diagnostic recording how long a plugin took. Collected into
   * the build result so the run summary can report per-plugin timings without a
   * separate channel.
   */
  static timing({ plugin, duration }: { plugin: string; duration: number }): Diagnostic {
    return {
      kind: 'timing',
      code: diagnosticCode.timing,
      severity: 'info',
      message: `${plugin} generated in ${Math.round(duration)}ms`,
      plugin,
      duration,
    }
  }

  /**
   * True when any diagnostic is an error, the severity that fails a build. Timing
   * and other non-error diagnostics are ignored.
   */
  static hasError(diagnostics: ReadonlyArray<Diagnostic>): boolean {
    return diagnostics.some((diagnostic) => diagnostic.severity === 'error')
  }

  /**
   * Names of the plugins that failed, deduped, derived from the error diagnostics
   * that carry a `plugin`.
   */
  static failedPlugins(diagnostics: ReadonlyArray<Diagnostic>): Array<string> {
    const names = new Set<string>()
    for (const diagnostic of diagnostics) {
      if (diagnostic.severity === 'error' && diagnostic.plugin) {
        names.add(diagnostic.plugin)
      }
    }
    return [...names]
  }

  /**
   * Counts `problem` diagnostics by severity for the run summary. `timing`
   * diagnostics are ignored.
   */
  static count(diagnostics: ReadonlyArray<Diagnostic>): { errors: number; warnings: number; infos: number } {
    let errors = 0
    let warnings = 0
    let infos = 0
    for (const diagnostic of diagnostics) {
      if (diagnostic.kind === 'timing') {
        continue
      }
      if (diagnostic.severity === 'error') {
        errors += 1
      } else if (diagnostic.severity === 'warning') {
        warnings += 1
      } else {
        infos += 1
      }
    }
    return { errors, warnings, infos }
  }

  /**
   * Drops duplicate `problem` diagnostics that share a code, location pointer, and
   * plugin, so the same issue reported across several passes is shown once. `timing`
   * diagnostics are always kept.
   */
  static dedupe(diagnostics: ReadonlyArray<Diagnostic>): Array<Diagnostic> {
    const seen = new Set<string>()
    const result: Array<Diagnostic> = []
    for (const diagnostic of diagnostics) {
      if (diagnostic.kind === 'timing') {
        result.push(diagnostic)
        continue
      }
      const pointer = diagnostic.location && 'pointer' in diagnostic.location ? diagnostic.location.pointer : ''
      const key = `${diagnostic.code} ${pointer} ${diagnostic.plugin ?? ''}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      result.push(diagnostic)
    }
    return result
  }

  /**
   * Applies per-code severity overrides from `config.diagnostics.levels`. A code mapped to
   * a severity re-levels the diagnostic; a code mapped to `'off'` drops it. `timing`
   * diagnostics pass through untouched.
   */
  static applyLevels(diagnostics: ReadonlyArray<Diagnostic>, levels: DiagnosticLevels | undefined): Array<Diagnostic> {
    if (!levels) {
      return [...diagnostics]
    }
    const result: Array<Diagnostic> = []
    for (const diagnostic of diagnostics) {
      if (diagnostic.kind === 'timing') {
        result.push(diagnostic)
        continue
      }
      const level = levels[diagnostic.code]
      if (level === 'off') {
        continue
      }
      result.push(level ? { ...diagnostic, severity: level } : diagnostic)
    }
    return result
  }

  /**
   * Builds the kubb.dev docs URL for a diagnostic code, e.g.
   * `KUBB_REF_NOT_FOUND` → `https://kubb.dev/docs/5.x/diagnostics/kubb-ref-not-found`.
   */
  static docsUrl(code: string): string {
    const slug = code.toLowerCase().replaceAll('_', '-')
    return `https://kubb.dev/docs/${docsMajor}.x/diagnostics/${slug}`
  }

  /**
   * The catalog entry for a code: its title, cause, and fix. Mirrors the kubb.dev
   * `/diagnostics/<slug>` page.
   */
  static explain(code: DiagnosticCode): DiagnosticDoc {
    return diagnosticCatalog[code]
  }

  /**
   * Reduces a diagnostic to its JSON-safe fields plus a `docsUrl`, for machine-readable
   * consumers. The `cause`, `kind`, and `duration` are dropped, and absent optional
   * fields are omitted rather than set to `undefined`.
   */
  static serialize(diagnostic: Diagnostic): SerializedDiagnostic {
    return {
      code: diagnostic.code,
      severity: diagnostic.severity,
      message: diagnostic.message,
      ...(diagnostic.location ? { location: diagnostic.location } : {}),
      ...(diagnostic.help ? { help: diagnostic.help } : {}),
      ...(diagnostic.plugin ? { plugin: diagnostic.plugin } : {}),
      ...(diagnostic.code === diagnosticCode.unknown ? {} : { docsUrl: Diagnostics.docsUrl(diagnostic.code) }),
    }
  }
}
