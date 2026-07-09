import { AsyncLocalStorage } from 'node:async_hooks'
import { styleText } from 'node:util'
import { getErrorMessage } from '@internals/utils'
import { version } from '../package.json'
import { type DiagnosticCode, diagnosticCode } from './constants.ts'
import type { KubbHooks } from './types.ts'
import type { Hookable } from './Hookable.ts'

/**
 * Docs major version, derived from the package version so the link tracks the published major.
 */
const docsMajor = version.split('.')[0] ?? '5'

/**
 * How serious a diagnostic is. `error` fails the build, `warning` and `info`
 * are reported but do not.
 */
export type DiagnosticSeverity = 'error' | 'warning' | 'info'

/**
 * A human-readable explanation of a diagnostic code: a short title, what triggers it, and how
 * to resolve it. This is the source of truth the kubb.dev `/diagnostics/<slug>` pages mirror, so
 * every code stays documented in one place. Adding a code without documenting it fails the build.
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
 * What a diagnostic carries.
 * - `problem` is a build issue shown to the user, and the only kind rendered as a problem.
 * - `performance` records a plugin's elapsed time.
 * - `update` is a version notice.
 */
export type DiagnosticKind = 'problem' | 'performance' | 'update'

/**
 * Codes that describe a build problem: every {@link DiagnosticCode} except the
 * `performance` and `updateAvailable` codes, which ride on their own variants.
 */
export type ProblemCode = Exclude<DiagnosticCode, typeof diagnosticCode.performance | typeof diagnosticCode.updateAvailable>

/**
 * A build problem collected during a run, gathered into the result instead of
 * aborting on the first failure.
 */
export type ProblemDiagnostic = {
  /**
   * @default 'problem'
   */
  kind?: 'problem'
  /**
   * Stable identifier for the problem, from the {@link diagnosticCode} catalog.
   */
  code: ProblemCode
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
}

/**
 * A per-plugin performance record, built with {@link Diagnostics.performance}. The `performance`
 * kind keeps it out of the problem list. It feeds the per-plugin timing bars, and reporters sum
 * these into the run total.
 */
export type PerformanceDiagnostic = {
  kind: 'performance'
  code: typeof diagnosticCode.performance
  severity: 'info'
  message: string
  /**
   * The plugin this measurement belongs to.
   */
  plugin: string
  /**
   * Elapsed milliseconds.
   */
  duration: number
}

/**
 * A notice that a newer Kubb version is available on npm, built with {@link Diagnostics.update}.
 * It renders like any info diagnostic.
 */
export type UpdateDiagnostic = {
  kind: 'update'
  code: typeof diagnosticCode.updateAvailable
  severity: 'info'
  message: string
  /**
   * The running Kubb version.
   */
  currentVersion: string
  /**
   * The newest version published on npm.
   */
  latestVersion: string
}

/**
 * A structured record collected during a build, discriminated on `kind`: a
 * {@link ProblemDiagnostic} for an issue, a {@link PerformanceDiagnostic} for a per-plugin
 * timing, or an {@link UpdateDiagnostic} for a version notice.
 */
export type Diagnostic = ProblemDiagnostic | PerformanceDiagnostic | UpdateDiagnostic

/**
 * Maps each {@link DiagnosticCode} to the variant it selects, for {@link narrow}.
 * Every {@link ProblemCode} selects a {@link ProblemDiagnostic}, and the two bookkeeping codes
 * select their own variant.
 */
export type DiagnosticByCode = Record<ProblemCode, ProblemDiagnostic> &
  Record<typeof diagnosticCode.performance, PerformanceDiagnostic> &
  Record<typeof diagnosticCode.updateAvailable, UpdateDiagnostic>

/**
 * Narrows a {@link Diagnostic} to the variant for `code`, or `null` when it does not match.
 *
 * @example
 * ```ts
 * const update = narrow(diagnostic, diagnosticCode.updateAvailable)
 * if (update) {
 *   console.log(update.latestVersion)
 * }
 * ```
 */
function narrow<C extends DiagnosticCode>(diagnostic: Diagnostic, code: C): DiagnosticByCode[C] | null {
  return diagnostic.code === code ? (diagnostic as DiagnosticByCode[C]) : null
}

/**
 * Builds a type guard that narrows a {@link Diagnostic} to the variant for `kind`. A diagnostic
 * with no `kind` is treated as a `problem`.
 */
function isKind<T extends Diagnostic>(kind: DiagnosticKind) {
  return (diagnostic: Diagnostic): diagnostic is T => (diagnostic.kind ?? 'problem') === kind
}

/**
 * Returns `true` when the diagnostic is a build {@link ProblemDiagnostic}.
 *
 * @example
 * ```ts
 * if (isProblem(diagnostic)) {
 *   console.log(diagnostic.location)
 * }
 * ```
 */
const isProblem = isKind<ProblemDiagnostic>('problem')

/**
 * Returns `true` when the diagnostic is a per-plugin {@link PerformanceDiagnostic}.
 *
 * @example
 * ```ts
 * const timings = diagnostics.filter(isPerformance)
 * ```
 */
const isPerformance = isKind<PerformanceDiagnostic>('performance')

/**
 * Returns `true` when the diagnostic is a version-update {@link UpdateDiagnostic}.
 *
 * @example
 * ```ts
 * if (isUpdate(diagnostic)) {
 *   console.log(diagnostic.latestVersion)
 * }
 * ```
 */
const isUpdate = isKind<UpdateDiagnostic>('update')

/**
 * Accent color per severity. The color tints the `[CODE]` tag (red error, yellow warning,
 * blue info).
 */
const severityStyle: Record<DiagnosticSeverity, 'red' | 'yellow' | 'blue'> = {
  error: 'red',
  warning: 'yellow',
  info: 'blue',
}

/**
 * A {@link Diagnostic} reduced to its JSON-safe fields plus a `docsUrl`, for
 * machine-readable output (the `--reporter json` report, the MCP tools). Drops the
 * non-serializable `cause` and the `kind`/`duration` bookkeeping.
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
 * Explanation for every {@link diagnosticCode}. Use {@link Diagnostics.explain} to look one up
 * and `Diagnostics.docsUrl` for the matching kubb.dev page.
 */
const diagnosticCatalog: Record<DiagnosticCode, DiagnosticDoc> = {
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
    fix: 'Use a format Kubb supports, or handle the custom format with a parser or plugin.',
  },
  [diagnosticCode.deprecated]: {
    title: 'Deprecated',
    cause: 'A referenced schema or operation is marked `deprecated`.',
    fix: 'Migrate off the deprecated definition if the warning is unwanted.',
  },
  [diagnosticCode.adapterRequired]: {
    title: 'Adapter required',
    cause: 'An action needs an adapter but none is configured.',
    fix: 'Set `adapter` in kubb.config.ts, for example `adapterOas()`.',
  },
  [diagnosticCode.pathTraversal]: {
    title: 'Path traversal',
    cause: 'A resolved output path escaped the output directory, which can stem from a path traversal in the spec or a misconfigured `group.name`.',
    fix: 'Keep generated paths within the output directory. Review the `group.name` function and the names coming from the spec.',
  },
  [diagnosticCode.invalidPluginOptions]: {
    title: 'Invalid plugin options',
    cause: "A plugin was configured with options that cannot be honored, for example `output.mode: 'file'` paired with a `group` option.",
    fix: "Fix the plugin options. A single-file output has nothing to group, so remove the `group` option or use `output.mode: 'directory'`.",
  },
  [diagnosticCode.postGenerateFailed]: {
    title: 'Post-generate command failed',
    cause: 'A post-generate command (`output.postGenerate`) exited with a non-zero status.',
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
  [diagnosticCode.performance]: {
    title: 'Performance',
    cause: 'Not a failure. Records a plugin’s elapsed time, summed into the run total.',
    fix: 'No action. This is an informational metric.',
  },
  [diagnosticCode.updateAvailable]: {
    title: 'Update available',
    cause: 'A newer Kubb version is published on npm than the one running.',
    fix: 'Update the `@kubb/*` packages, for example `npm install -g @kubb/cli`, to get the latest fixes.',
  },
}

/**
 * Static helpers for working with {@link Diagnostic}s, plus the run-scoped sink
 * that lets deep code report a diagnostic without threading a callback.
 *
 * The sink lives in a single `AsyncLocalStorage` in the `@kubb/core` bundle.
 * `Diagnostics.scope` activates it for a run, so anything inside that run (the
 * adapter parse, a generator) reports through `Diagnostics.report` and lands
 * in the same run.
 */
export class Diagnostics {
  static #reporterStorage = new AsyncLocalStorage<(diagnostic: Diagnostic) => void>()

  /**
   * The diagnostic code catalog, exposed as `Diagnostics.code` (e.g. `Diagnostics.code.refNotFound`).
   */
  static code = diagnosticCode

  /**
   * Type guard for a build {@link ProblemDiagnostic}.
   */
  static isProblem = isProblem

  /**
   * Type guard for a version-update {@link UpdateDiagnostic}.
   */
  static isUpdate = isUpdate

  /**
   * Type guard for a per-plugin {@link PerformanceDiagnostic}.
   */
  static isPerformance = isPerformance

  /**
   * Narrows a {@link Diagnostic} to the variant for `code`, or `null` when it does not match.
   */
  static narrow = narrow

  /**
   * An `Error` that carries a {@link Diagnostic}, so structured problems can flow
   * through the existing throw/catch paths while keeping their code and location.
   *
   * @example
   * ```ts
   * throw new Diagnostics.Error({ code: diagnosticCode.refNotFound, severity: 'error', message: `Could not find ${ref}`, location: { kind: 'schema', pointer: ref, ref } })
   * ```
   */
  static Error = class DiagnosticError extends Error {
    diagnostic: ProblemDiagnostic

    constructor(diagnostic: ProblemDiagnostic) {
      super(diagnostic.message, { cause: diagnostic.cause })
      this.name = 'DiagnosticError'
      this.diagnostic = diagnostic
    }
  }

  /**
   * Structural check for a {@link Diagnostics.Error}, including one thrown from a duplicated
   * `@kubb/core` copy where `instanceof` fails. Matches on the `name` and a `diagnostic`
   * that carries a `code`.
   */
  static isError(error: unknown): error is InstanceType<typeof Diagnostics.Error> {
    if (error instanceof Diagnostics.Error) {
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
   * Runs `fn` with `sink` as the active diagnostic sink for the whole async
   * subtree, so {@link Diagnostics.report} reaches it from anywhere inside.
   */
  static scope<T>(sink: (diagnostic: Diagnostic) => void, fn: () => T): T {
    return Diagnostics.#reporterStorage.run(sink, fn)
  }

  /**
   * Collects a diagnostic into the active build via the run-scoped sink, without throwing.
   * Returns `true` when a run consumed it, `false` when called outside a {@link Diagnostics.scope}
   * (so callers can fall back to throwing). Use a `warning`/`info` severity for non-fatal issues.
   * For rendering a diagnostic live on the hook bus, use {@link Diagnostics.emit} instead.
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
   * Emits a diagnostic on the run's `kubb:diagnostic` hook so the loggers render it live.
   * Use it instead of calling `hooks.callHook('kubb:diagnostic', ...)` directly. To collect a
   * diagnostic into the build result from deep in a run, use {@link Diagnostics.report} instead.
   */
  static async emit(hooks: Hookable<KubbHooks>, diagnostic: ProblemDiagnostic | UpdateDiagnostic): Promise<void> {
    await hooks.callHook('kubb:diagnostic', { diagnostic })
  }

  /**
   * Coerces any thrown value into a {@link ProblemDiagnostic}. A {@link Diagnostics.Error}
   * keeps its structured data, and anything else becomes a `KUBB_UNKNOWN` error.
   */
  static from(error: unknown): ProblemDiagnostic {
    // The hook emitter and BuildError wrap the original, so walk the cause chain to
    // recover a Diagnostics.Error thrown deeper down. `root` tracks the deepest error so
    // the unknown diagnostic reports the original message and stack, not the wrapper's.
    const seen = new Set<unknown>()
    let current: unknown = error
    let root: Error | undefined
    while (current instanceof Error && !seen.has(current)) {
      // Match structurally, not just by `instanceof`: a `Diagnostics.Error` thrown from a
      // duplicated `@kubb/core` copy (bundled into an adapter or plugin) is a different
      // class, but still carries the same `diagnostic`, so its code must survive.
      if (Diagnostics.isError(current)) {
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
   * Builds a per-plugin performance record. Reporters sum these into the run total.
   */
  static performance({ plugin, duration }: { plugin: string; duration: number }): PerformanceDiagnostic {
    return {
      kind: 'performance',
      code: diagnosticCode.performance,
      severity: 'info',
      message: `${plugin} generated in ${Math.round(duration)}ms`,
      plugin,
      duration,
    }
  }

  /**
   * Builds the version-update notice shown when a newer Kubb is published on npm.
   */
  static update({ currentVersion, latestVersion }: { currentVersion: string; latestVersion: string }): UpdateDiagnostic {
    return {
      kind: 'update',
      code: diagnosticCode.updateAvailable,
      severity: 'info',
      message: `Update available: v${currentVersion} → v${latestVersion}. Run \`npm install -g @kubb/cli\` to update.`,
      currentVersion,
      latestVersion,
    }
  }

  /**
   * True when any diagnostic is an error, the severity that fails a build. Non-error
   * diagnostics are ignored.
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
   * Counts `problem` diagnostics by severity for the run summary. `performance` and
   * `update` diagnostics are ignored.
   */
  static count(diagnostics: ReadonlyArray<Diagnostic>): { errors: number; warnings: number; infos: number } {
    let errors = 0
    let warnings = 0
    let infos = 0
    for (const diagnostic of diagnostics) {
      if (!isProblem(diagnostic)) {
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
   * plugin, so the same issue reported across several passes is shown once. Non-problem
   * diagnostics are always kept.
   */
  static dedupe(diagnostics: ReadonlyArray<Diagnostic>): Array<Diagnostic> {
    const seen = new Set<string>()
    const result: Array<Diagnostic> = []
    for (const diagnostic of diagnostics) {
      if (!isProblem(diagnostic)) {
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
   * Builds the kubb.dev docs URL for a diagnostic code, e.g.
   * `KUBB_REF_NOT_FOUND` → `https://kubb.dev/docs/5.x/reference/diagnostics/kubb-ref-not-found`.
   */
  static docsUrl(code: string): string {
    const slug = code.toLowerCase().replaceAll('_', '-')
    return `https://kubb.dev/docs/${docsMajor}.x/reference/diagnostics/${slug}`
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
    const problem = isProblem(diagnostic) ? diagnostic : undefined
    return {
      code: diagnostic.code,
      severity: diagnostic.severity,
      message: diagnostic.message,
      ...(problem?.location ? { location: problem.location } : {}),
      ...(problem?.help ? { help: problem.help } : {}),
      ...(problem?.plugin ? { plugin: problem.plugin } : {}),
      ...(diagnostic.code === diagnosticCode.unknown ? {} : { docsUrl: Diagnostics.docsUrl(diagnostic.code) }),
    }
  }

  /**
   * Renders a {@link Diagnostic} for terminal output as its parts: the `headline`
   * (`[CODE] plugin: message`, with the code in the severity color) and the indented `details`
   * rows (`at:` pointer, `fix:` help, `see:` docs link).
   *
   * Hosts compose these to fit their gutter: a clack logger passes `[headline, ...details]` as the
   * message with no gutter symbol, while plain text outputs use {@link Diagnostics.formatLines}.
   */
  static format(diagnostic: Diagnostic): { headline: string; details: Array<string> } {
    const { code, severity, message } = diagnostic
    const color = severityStyle[severity]
    const problem = isProblem(diagnostic) ? diagnostic : undefined

    const tag = styleText(color, styleText('bold', `[${code}]`))
    const headline = problem?.plugin ? `${tag} ${problem.plugin}: ${message}` : `${tag}: ${message}`

    const details: Array<string> = []
    if (problem?.location && 'pointer' in problem.location) {
      details.push(`  ${styleText('dim', 'at:')} ${styleText('cyan', problem.location.pointer)}`)
    }
    if (problem?.help) {
      details.push(`  ${styleText('cyan', 'fix:')} ${problem.help}`)
    }
    if (code !== diagnosticCode.unknown) {
      details.push(`  ${styleText('dim', 'see:')} ${styleText('cyan', Diagnostics.docsUrl(code))}`)
    }

    return { headline, details }
  }

  /**
   * The self-contained block form of {@link Diagnostics.format}: the `headline` followed by the
   * indented detail rows. Used where there is no gutter (plain and file output).
   */
  static formatLines(diagnostic: Diagnostic): Array<string> {
    const { headline, details } = Diagnostics.format(diagnostic)
    return [headline, ...details]
  }
}
