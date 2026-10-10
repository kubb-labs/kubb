import process from 'node:process'
import type { Config, Reporter, ReporterContext, ReporterPluginFiles } from '@kubb/core'
import { createCliReporter } from '@kubb/core'
import { isRichOutput } from '../utils/env.ts'
import type { Logger, LoggerContext, LoggerOptions } from './defineLogger.ts'
import { clackLogger } from './clackLogger.ts'
import { plainLogger } from './plainLogger.ts'

/** Bridges a {@link Reporter} onto the hook emitter: calls `report` with each config's {@link GenerationResult} on `kubb:generation:end`. */
function installReporter(context: LoggerContext, reporter: Reporter, ctx: ReporterContext): void {
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

/** Installs the live logger and wires the selected reporters. `cli` renders its summary through the logger, and is skipped when `json` owns stdout. */
function setupReporters(
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
): void {
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
    const handle = logger(context, { logLevel })

    // The summary belongs inside the group the logger opened for this config, so the logger writes it.
    installReporter(context, createCliReporter({ render: handle?.renderSummary }), ctx)
  }
}

export default setupReporters

/** Picks the reporters whose `name` is in `names`, in the given order (the CLI maps `--reporter` to this); duplicates and unknown names are skipped. */
export function selectReporters(reporters: ReadonlyArray<Reporter>, names: ReadonlyArray<string>): Array<Reporter> {
  return [...new Set(names)].flatMap((name) => reporters.find((reporter) => reporter.name === name) ?? [])
}
