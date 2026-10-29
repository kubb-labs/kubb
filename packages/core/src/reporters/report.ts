import { resolve } from 'node:path'
import process from 'node:process'
import { getElapsedMs } from '@internals/utils'
import type { GenerationResult } from '../createReporter.ts'
import { Diagnostics } from '../Diagnostics.ts'
import type { SerializedDiagnostic } from '../formatDiagnostic.ts'
import { resolveKubbDir } from '../storages/kubbStorage.ts'
import type { Config } from '../types.ts'

/**
 * Where a reporter writes its output: the project's `.kubb` folder (resolved through
 * {@link resolveKubbDir}) and a `kubb-<name>-<timestamp>` file name, with the config name reduced to
 * `[a-zA-Z0-9_-]` so it cannot leave the folder.
 */
export function reportTarget(config: Config): { dir: string; name: string } {
  const name = config.name?.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
  return {
    dir: resolveKubbDir(resolve(process.cwd(), '.kubb')),
    name: ['kubb', name, Date.now()].filter(Boolean).join('-'),
  }
}

/**
 * One plugin's elapsed time, derived from a `performance` diagnostic.
 */
type ReportTiming = {
  plugin: string
  durationMs: number
}

/**
 * The normalized result of generating one config, shared by every reporter. Each reporter renders
 * the same {@link Report} in its own format (the `cli` summary, the `json` document, the `file`
 * log), so they always agree on the numbers. Build it with {@link buildReport}.
 */
export type Report = {
  /**
   * The config name, or an empty string when it is unnamed.
   */
  name: string
  status: 'success' | 'failed'
  plugins: {
    passed: number
    /**
     * Names of the plugins that failed.
     */
    failed: Array<string>
    total: number
  }
  counts: {
    errors: number
    warnings: number
    infos: number
  }
  filesCreated: number
  /**
   * Generated files whose content matches the previous output.
   */
  filesUnchanged: number
  fileChanges?: GenerationResult['fileChanges']
  dryRun?: boolean
  /**
   * Wall-clock time spent generating this config, in milliseconds.
   */
  durationMs: number
  /**
   * Absolute output directory the files were written to.
   */
  output: string
  /**
   * Per-plugin durations, slowest first.
   */
  timings: Array<ReportTiming>
  /**
   * The build problems, serialized to their JSON-safe fields plus a `docsUrl`.
   */
  diagnostics: Array<SerializedDiagnostic>
}

/**
 * Builds the normalized {@link Report} for one config from its {@link GenerationResult}. Splits the
 * diagnostics into problems and per-plugin timings (slowest first) and derives the plugin and issue
 * counts, so every reporter renders the same data.
 */
export function buildReport(result: GenerationResult): Report {
  const { config, diagnostics, filesCreated, filesUnchanged = 0, status, hrStart } = result

  const failed = Diagnostics.failedPlugins(diagnostics)
  const total = config.plugins?.length ?? 0
  const counts = Diagnostics.count(diagnostics)
  const problems = diagnostics.filter(Diagnostics.isProblem)
  const timings = diagnostics
    .filter(Diagnostics.isPerformance)
    .sort((a, b) => b.duration - a.duration)
    .map((diagnostic) => ({ plugin: diagnostic.plugin, durationMs: diagnostic.duration }))

  return {
    name: config.name ?? '',
    status,
    // A failed run without timings stopped before any plugin ran, such as on an invalid plugin entry.
    plugins: { passed: status === 'failed' && timings.length === 0 ? 0 : total - failed.length, failed, total },
    counts,
    filesCreated,
    filesUnchanged,
    fileChanges: result.fileChanges,
    dryRun: result.dryRun,
    durationMs: getElapsedMs(hrStart),
    output: resolve(config.root, config.output.path),
    timings,
    diagnostics: problems.map((diagnostic) => Diagnostics.serialize(diagnostic)),
  }
}
