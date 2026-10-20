import type { Hookable, KubbHooks, SummaryRenderer } from '@kubb/core'
import type { LoggerWriter } from '../types.ts'
import { createLoggerContext } from './context.ts'
import { createGeneration } from './generation.ts'
import { createPhases } from './phases.ts'
import { createProblems } from './problems.ts'
import { createProgress } from './progress.ts'
import { createSession } from './session.ts'
import { createSpinner } from './spinner.ts'
import { createWalk } from './walk.ts'

/**
 * Wires a {@link LoggerWriter} onto the run's hooks. Each feature registers the hooks for one
 * concern, so every writer reports the same run in the same order: one group per config, a step
 * over the plugin work, a progress bar for the writes, one step per output phase, then the summary.
 * It hands back `renderSummary`, which writes the `cli` reporter's summary inside the group opened
 * for that config and closes the group.
 */
export function installLogger({ hooks, writer, logLevel }: { hooks: Hookable<KubbHooks>; writer: LoggerWriter; logLevel: number }): {
  renderSummary: SummaryRenderer
} {
  const ctx = createLoggerContext({ hooks, writer, logLevel })
  const spinner = createSpinner(ctx)
  const progress = createProgress(ctx, spinner)
  const walk = createWalk(ctx, spinner, progress)
  const phases = createPhases(ctx, spinner)
  const problems = createProblems(ctx, spinner, progress, phases)
  createSession(ctx, spinner)
  return createGeneration(ctx, { spinner, progress, walk, phases, problems })
}
