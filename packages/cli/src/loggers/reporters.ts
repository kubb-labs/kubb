import process from 'node:process'
import type { Config, Reporter, ReporterContext, ReporterPluginFiles } from '@kubb/core'
import { createCliReporter } from '@kubb/core'
import { isRichOutput } from '../utils/env.ts'
import type { Logger, LoggerContext, LoggerOptions } from './defineLogger.ts'
import { clackLogger } from './clackLogger.ts'
import { plainLogger } from './plainLogger.ts'

/**
 * Bridges a {@link Reporter} onto the run's hook emitter: calls `report` with each config's
 * {@link GenerationResult} on `kubb:generation:end`. The reporter never touches the emitter.
 */
export function installReporter(context: LoggerContext, reporter: Reporter, ctx: ReporterContext): void {
  const pluginFiles = reporter.needsPluginFiles ? new Map<Config, Map<string, Set<string>>>() : undefined

  if (pluginFiles) {
    context.hook('kubb:plugin:end', ({ config, plugin, files }) => {
      const filesByPlugin = pluginFiles.get(config) ?? new Map<string, Set<string>>()
      const seen = new Set([...filesByPlugin.values()].flatMap((paths) => [...paths]))
      const added = files.filter((file) => !seen.has(file.path)).map((file) => file.path)

      if (added.length) filesByPlugin.set(plugin.name, new Set([...(filesByPlugin.get(plugin.name) ?? []), ...added]))

      pluginFiles.set(config, filesByPlugin)
    })
  }

  context.hook('kubb:generation:end', async ({ config, diagnostics = [], filesCreated = 0, status = 'success', hrStart = process.hrtime() }) => {
    const files = pluginFiles?.get(config)
    const grouped: ReporterPluginFiles | undefined = files && [...files].map(([plugin, paths]) => ({ plugin, files: [...paths] }))

    await reporter.report({ config, diagnostics, filesCreated, status, hrStart, pluginFiles: grouped }, ctx)

    pluginFiles?.delete(config)
  })

  if (reporter.drain) {
    context.hook('kubb:lifecycle:end', () => reporter.drain?.(ctx))
  }
}

/**
 * Installs the live logger (the TUI view) and the given reporters (the output). The reporters are
 * already selected by the caller (the CLI maps `--reporter` to names via `selectReporters`). This
 * only wires them. Loggers receive hook subprocess output through `kubb:hook:line` and the
 * `stdout`/`stderr` on `kubb:hook:end`, so nothing is returned here.
 *
 * Loggers and reporters are independent, except for `cli`: it both installs the live logger view
 * here and registers a reporter that renders the per-config summary through that logger, so the
 * summary lands inside the group the logger opened. The `json` reporter owns stdout, so the whole
 * `cli` reporter (live logger and summary) is skipped whenever `json` is among the reporters, even
 * if `cli` is also listed.
 */
async function setupReporters(
  context: LoggerContext,
  {
    logLevel,
    reporters,
    logger: forcedLogger,
  }: LoggerOptions & {
    reporters: ReadonlyArray<Reporter>
    /** Overrides the terminal-based pick, e.g. the plain logger for `kubb studio snapshot`. */
    logger?: Logger
  },
): Promise<void> {
  const hasJson = reporters.some((reporter) => reporter.name === 'json')
  const ctx: ReporterContext = { logLevel }

  for (const reporter of reporters) {
    if (reporter.name !== 'cli') {
      installReporter(context, reporter, ctx)
      continue
    }

    if (hasJson) {
      continue
    }

    const logger = forcedLogger ?? (isRichOutput() ? clackLogger : plainLogger)
    const handle = (await logger.install(context, { logLevel })) ?? undefined

    // The summary belongs inside the group the logger opened for this config, so hand the writing
    // to the logger rather than letting the reporter print alongside it.
    installReporter(context, createCliReporter({ render: handle?.renderSummary }), ctx)
  }
}

export default setupReporters

/**
 * Picks the reporters whose `name` matches one of `names`, in the order the names are given.
 * The config carries every available reporter, and the host selects which to activate by name
 * (the CLI maps `--reporter` to this). Duplicate names and names without a matching reporter are
 * skipped.
 */
export function selectReporters(reporters: ReadonlyArray<Reporter>, names: ReadonlyArray<string>): Array<Reporter> {
  return [...new Set(names)].flatMap((name) => reporters.find((reporter) => reporter.name === name) ?? [])
}
