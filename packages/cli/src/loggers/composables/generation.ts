import { styleText } from 'node:util'
import type { SummaryRenderer } from '@kubb/core'
import type { LogStatus } from '../types.ts'
import { getInputPath, type LoggerContext } from './context.ts'
import type { Phases } from './phases.ts'
import type { Problems } from './problems.ts'
import type { Progress } from './progress.ts'
import type { Spinner } from './spinner.ts'
import type { Walk } from './walk.ts'

/**
 * One config's run: the group it opens, the state every feature resets at its start, and the
 * closing line, which the lifecycle end draws too for a run that threw before its summary.
 */
export function createGeneration(
  ctx: LoggerContext,
  { spinner, progress, walk, phases, problems }: { spinner: Spinner; progress: Progress; walk: Walk; phases: Phases; problems: Problems },
): { renderSummary: SummaryRenderer } {
  const { writer, silent, human, text, hooks, onRun } = ctx

  function reset() {
    spinner.reset()
    progress.reset()
    walk.reset()
    phases.reset()
    problems.reset()
  }

  // A run that throws before `kubb:generation:end` never reaches the summary, so the lifecycle
  // end calls this too rather than leave a group without its closing line.
  function closeGroup(status: LogStatus) {
    if (!ctx.groupOpen) {
      return
    }
    ctx.groupOpen = false

    spinner.stop()
    progress.stop()
    writer.groupEnd(status === 'failed' ? styleText('red', problems.failedTitle()) : styleText('green', '✓ Generation succeeded'))
  }

  hooks.hook('kubb:lifecycle:start', () => {
    reset()
  })

  onRun('kubb:generation:start', ({ config }) => {
    closeGroup('failed')
    reset()

    walk.state.totalPlugins = config.plugins?.length ?? 0
    progress.state.inMemory = config.storage?.name === 'memory'
    problems.setSpec(config)

    if (silent) {
      return
    }

    const input = getInputPath(config)
    writer.group(text([styleText('bold', config.name ?? 'kubb'), input ? styleText('dim', input) : undefined].filter(Boolean).join(' ')))
    ctx.groupOpen = true

    spinner.start('Parsing spec')
  })

  onRun('kubb:generation:end', async ({ diagnostics = [] }) => {
    spinner.stop()
    progress.stop()
    problems.state.diagnostics = diagnostics
    await problems.flush()
  })

  hooks.hook('kubb:lifecycle:end', async () => {
    await problems.flush()
    closeGroup('failed')
    reset()
  })

  const renderSummary: SummaryRenderer = (lines, { status }) => {
    if (silent || !ctx.groupOpen) {
      return
    }

    spinner.stop()
    progress.stop()
    if (human) closeGroup(status)
    ctx.groupOpen = false
    writer.diagnostic([...lines])
  }

  return { renderSummary }
}
