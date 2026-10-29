import { AsyncLocalStorage } from 'node:async_hooks'
import { getErrorChain, getErrorMessage, toError } from '@internals/utils'
import { type DiagnosticCode, diagnosticCode, docsUrl, explain, isKind, isProblem } from './diagnosticCatalog.ts'
import { crashCodes, format, serialize } from './formatDiagnostic.ts'
import type { ExtensionKind, ExtensionNamed } from './defineExtension.ts'
import type { KubbHooks } from './types.ts'
import type { Hookable } from './Hookable.ts'

/**
 * How serious a diagnostic is. `error` fails the build, `warning` and `info`
 * are reported but do not.
 */
export type DiagnosticSeverity = 'error' | 'warning' | 'info'

/**
 * A human-readable explanation of a diagnostic code: a short title, what triggers it, and how
 * to resolve it. This is the source of truth the kubb.dev `/reference/diagnostics#<slug>` sections mirror, so
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
  /** Issue tracker URL of the extension that crashed, from its `meta.issues`. */
  issues?: string
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

const failedCode = {
  plugin: diagnosticCode.pluginFailed,
  adapter: diagnosticCode.adapterFailed,
  parser: diagnosticCode.parserFailed,
} as const satisfies Record<ExtensionKind, ProblemCode>

const reporterKey = Symbol.for('kubb.diagnostics.reporter')

type ReporterHost = typeof globalThis & { [reporterKey]?: AsyncLocalStorage<(diagnostic: Diagnostic) => void> }

const countKey = { error: 'errors', warning: 'warnings', info: 'infos' } as const satisfies Record<DiagnosticSeverity, string>

/**
 * Static helpers for working with {@link Diagnostic}s, plus the run-scoped sink
 * that lets deep code report a diagnostic without threading a callback.
 *
 * The sink lives in a single `AsyncLocalStorage` on `globalThis`, shared by every copy of `@kubb/core`.
 * `Diagnostics.scope` activates it for a run, so anything inside that run (the
 * adapter parse, a generator) reports through `Diagnostics.report` and lands
 * in the same run.
 */
export class Diagnostics {
  // A plugin that loads another copy of `@kubb/core` (the project's own, beside a host such as the
  // Studio agent) still reports into the run, as `kubbContext` does.
  static #reporterStorage: AsyncLocalStorage<(diagnostic: Diagnostic) => void> = ((globalThis as ReporterHost)[reporterKey] ??= new AsyncLocalStorage())

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
    if (error instanceof Diagnostics.Error) return true
    if (!(error instanceof Error) || error.name !== 'DiagnosticError') return false

    const { diagnostic } = error as { diagnostic?: { code?: unknown } }
    return typeof diagnostic === 'object' && diagnostic !== null && typeof diagnostic.code === 'string'
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
   * Emits a diagnostic, or any thrown value, on the run's hooks so the loggers render it live.
   * A coded problem or an update goes to `kubb:diagnostic`. An uncoded one goes to `kubb:error`
   * whole, so every wrapper's message, its help, and the stack survive. To collect a diagnostic into
   * the build result from deep in a run, use {@link Diagnostics.report} instead.
   */
  static async emit(hooks: Hookable<KubbHooks>, value: ProblemDiagnostic | UpdateDiagnostic | unknown): Promise<void> {
    const thrown = value instanceof Error || typeof (value as Diagnostic | undefined)?.code !== 'string'
    const diagnostic = thrown ? Diagnostics.from(value) : (value as ProblemDiagnostic | UpdateDiagnostic)
    if (!isProblem(diagnostic) || diagnostic.code !== diagnosticCode.unknown) {
      await hooks.callHook('kubb:diagnostic', { diagnostic })
      return
    }
    const { cause, help, message } = diagnostic
    const bare = cause && !help && cause.message === message
    await hooks.callHook('kubb:error', { error: thrown ? toError(value) : bare ? cause : new Diagnostics.Error(diagnostic) })
  }

  /**
   * Coerces any thrown value into a {@link ProblemDiagnostic}. A {@link Diagnostics.Error}
   * keeps its structured data, and anything else becomes a `KUBB_UNKNOWN` error.
   */
  static from(error: unknown): ProblemDiagnostic {
    // The hook emitter and the build's AggregateError wrap the original, so walk the cause chain to
    // recover a Diagnostics.Error thrown deeper down. `root` tracks the deepest error so
    // the unknown diagnostic reports the original message and stack, not the wrapper's.
    const chain = getErrorChain(error)
    // Match structurally, not just by `instanceof`: a `Diagnostics.Error` thrown from a
    // duplicated `@kubb/core` copy (bundled into an adapter or plugin) is a different
    // class, but still carries the same `diagnostic`, so its code must survive.
    // The innermost one wins: it is where the problem started, and a wrapper only adds context.
    const coded = chain.findLast((current) => Diagnostics.isError(current))
    if (coded) {
      const { diagnostic } = coded as InstanceType<typeof Diagnostics.Error>
      // A crash thrown without a cause still needs a stack, so it points at itself.
      return diagnostic.cause || !crashCodes.has(diagnostic.code) ? diagnostic : { ...diagnostic, cause: coded }
    }
    const root = chain.at(-1)

    return {
      code: diagnosticCode.unknown,
      severity: 'error',
      message: root ? root.message : getErrorMessage(error),
      cause: root,
    }
  }

  /**
   * Coerces an error thrown by a plugin, adapter, or parser into a diagnostic attributed to it.
   * A structured {@link Diagnostics.Error} keeps its code. Any other error is a crash: it gets the
   * kind's `*_FAILED` code and the extension's `meta.issues` link, so the user reports it to the
   * extension's maintainers instead of to Kubb.
   */
  static fromExtension(error: unknown, { kind, extension }: { kind: ExtensionKind; extension: ExtensionNamed }): ProblemDiagnostic {
    const diagnostic = Diagnostics.from(error)
    const name = extension.meta?.name ?? extension.name
    // `plugin` feeds the failed-plugin count, so an adapter or parser is named in the message instead.
    const owner = kind === 'plugin' ? { plugin: diagnostic.plugin ?? name } : {}
    // An abort is the user canceling the run, not a crash.
    const crashed = diagnostic.code === diagnosticCode.unknown && diagnostic.cause?.name !== 'AbortError'
    const failed = Object.values<DiagnosticCode>(failedCode).includes(diagnostic.code)
    if (!crashed && !failed) {
      return { ...diagnostic, ...owner }
    }

    const issues = extension.meta?.issues
    return {
      ...diagnostic,
      ...owner,
      code: crashed ? failedCode[kind] : diagnostic.code,
      message: crashed && kind !== 'plugin' ? `${kind} "${name}" crashed: ${diagnostic.message}` : diagnostic.message,
      ...(issues ? { issues } : {}),
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
    return [...new Set(diagnostics.flatMap((diagnostic) => (diagnostic.severity === 'error' && diagnostic.plugin ? [diagnostic.plugin] : [])))]
  }

  /**
   * Counts `problem` diagnostics by severity for the run summary. `performance` and
   * `update` diagnostics are ignored.
   */
  static count(diagnostics: ReadonlyArray<Diagnostic>): { errors: number; warnings: number; infos: number } {
    const counts = { errors: 0, warnings: 0, infos: 0 }
    for (const diagnostic of diagnostics.filter(isProblem)) {
      counts[countKey[diagnostic.severity]] += 1
    }
    return counts
  }

  /**
   * Drops duplicate `problem` diagnostics that share a code, location pointer, and
   * plugin, so the same issue reported across several passes is shown once. Non-problem
   * diagnostics are always kept.
   */
  static dedupe(diagnostics: ReadonlyArray<Diagnostic>): Array<Diagnostic> {
    const seen = new Set<string>()
    return diagnostics.filter((diagnostic) => {
      if (!isProblem(diagnostic)) return true
      const pointer = diagnostic.location && 'pointer' in diagnostic.location ? diagnostic.location.pointer : ''
      const key = `${diagnostic.code} ${pointer} ${diagnostic.plugin ?? ''}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  /**
   * Builds the kubb.dev docs URL for a diagnostic code, e.g.
   * `KUBB_REF_NOT_FOUND` → `https://kubb.dev/docs/5.x/reference/diagnostics#kubb-ref-not-found`.
   */
  static docsUrl = docsUrl

  /**
   * The catalog entry for a code: its title, cause, and fix. Mirrors the kubb.dev
   * `/reference/diagnostics#<slug>` section.
   */
  static explain = explain

  /**
   * Reduces a diagnostic to its JSON-safe fields plus a `docsUrl`, for machine-readable
   * consumers, with the catalog `title`, `cause`, and fix, and the `cause` error as `causes` and
   * `stack`. Absent optional fields are omitted.
   */
  static serialize = serialize

  /**
   * Renders a diagnostic as lines for an `agent` (the default) or a `human`. See {@link format}.
   */
  static format = format
}
