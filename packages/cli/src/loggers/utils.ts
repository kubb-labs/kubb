import process from 'node:process'
import type { LoggerContext, LoggerOptions, Reporter, ReporterContext, ReporterName } from '@kubb/core'
import { middlewareLogger, type HookSinkFactory } from '@kubb/middleware-logger'
import { cliReporter } from '../reporters/cliReporter.ts'
import { fileReporter } from '../reporters/fileReporter.ts'
import { jsonReporter } from '../reporters/jsonReporter.ts'

/**
 * Bridges a {@link Reporter} onto the run's event emitter: calls `report` with each config's
 * {@link GenerationResult} on `kubb:generation:end`. The reporter never touches the emitter.
 */
export function installReporter(context: LoggerContext, reporter: Reporter, ctx: ReporterContext): void {
  context.on('kubb:generation:end', async ({ config, diagnostics = [], filesCreated = 0, status = 'success', hrStart = process.hrtime() }) => {
    await reporter.report({ config, diagnostics, filesCreated, status, hrStart }, ctx)
  })

  if (reporter.flush) {
    context.on('kubb:lifecycle:end', () => reporter.flush?.(ctx))
  }
}

/**
 * Installs the unified middleware logger and the selected reporters, returning its hook sink
 * factory. The `json` reporter owns stdout, so the live logger and `cli` summary are suppressed
 * whenever `json` is selected, even if `cli` is also listed.
 */
export async function setupReporters(
  context: LoggerContext,
  { logLevel, reporters }: LoggerOptions & { reporters: ReadonlyArray<ReporterName> },
): Promise<HookSinkFactory | null> {
  const unique = new Set<ReporterName>(reporters.length ? reporters : ['cli'])
  const hasJson = unique.has('json')
  const ctx: ReporterContext = { logLevel }

  let makeSink: HookSinkFactory | null = null

  if (unique.has('cli') && !hasJson) {
    const sink = await middlewareLogger.install(context, { logLevel })
    makeSink = typeof sink === 'function' ? sink : null
    installReporter(context, cliReporter, ctx)
  }

  if (hasJson) {
    installReporter(context, jsonReporter, ctx)
  }

  if (unique.has('file')) {
    installReporter(context, fileReporter, ctx)
  }

  return makeSink
}
