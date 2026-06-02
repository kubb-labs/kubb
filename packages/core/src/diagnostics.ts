import { AsyncLocalStorage } from 'node:async_hooks'
import { getErrorMessage } from '@internals/utils'
import { type DiagnosticCode, diagnosticCode } from './constants.ts'

/**
 * How serious a diagnostic is. `error` fails the build, `warning` and `info`
 * are reported but do not.
 */
export type DiagnosticSeverity = 'error' | 'warning' | 'info'

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
      if (current instanceof DiagnosticError) {
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
}
