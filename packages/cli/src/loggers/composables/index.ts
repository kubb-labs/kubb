import type { DiagnosticFormatOptions, Hookable, KubbHooks, SummaryRenderer } from '@kubb/core'
import type { LoggerWriter } from '../defineLogger.ts'
import { createLoggerContext, provideLogger } from './context.ts'
import { useGeneration } from './useGeneration.ts'
import { usePhases } from './usePhases.ts'
import { useProblems } from './useProblems.ts'
import { useProgress } from './useProgress.ts'
import { useSession } from './useSession.ts'
import { useSpinner } from './useSpinner.ts'
import { useWalk } from './useWalk.ts'

/**
 * Wires a {@link LoggerWriter} onto the run's hooks. Each composable registers the hooks for one
 * feature, so every writer reports the same run in the same order: one group per config, a step
 * over the plugin work, a progress bar for the writes, one step per output phase, then the summary.
 */
export function installLogger({
  hooks,
  writer,
  logLevel,
  audience,
}: {
  hooks: Hookable<KubbHooks>
  writer: LoggerWriter
  logLevel: number
  audience: DiagnosticFormatOptions['audience']
}): { renderSummary: SummaryRenderer } {
  const ctx = createLoggerContext({ hooks, writer, logLevel, audience })
  return provideLogger(ctx, () => {
    useSpinner()
    useProgress()
    useWalk()
    usePhases()
    useProblems()
    useSession()
    const { renderSummary } = useGeneration()
    return { renderSummary: (lines, options) => provideLogger(ctx, () => renderSummary(lines, options)) }
  })
}
