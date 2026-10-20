import { styleText } from 'node:util'
import type { SummaryRenderer } from '@kubb/core'
import { getInputPath } from '../createLogger.ts'
import type { LogStatus } from '../defineLogger.ts'
import { useFeature, useLogger } from './context.ts'
import { usePhases } from './usePhases.ts'
import { useProblems } from './useProblems.ts'
import { useProgress } from './useProgress.ts'
import { useSpinner } from './useSpinner.ts'
import { useWalk } from './useWalk.ts'

/**
 * One config's run: the group it opens, the state every feature resets at its start, and the
 * closing line, which the lifecycle end draws too for a run that threw before its summary.
 */
export function useGeneration() {
  return useFeature('generation', () => {
    const { writer, silent, human, text, hook, onRun } = useLogger()
    // Resolved here, not in the hooks: an async listener loses the context after its first `await`.
    const spinner = useSpinner()
    const progress = useProgress()
    const walk = useWalk()
    const phases = usePhases()
    const problems = useProblems()
    let groupOpen = false

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
      if (!groupOpen) {
        return
      }
      groupOpen = false

      spinner.stop()
      progress.stop()
      writer.groupEnd(status === 'failed' ? styleText('red', problems.failedTitle()) : styleText('green', '✓ Generation succeeded'))
    }

    hook('kubb:lifecycle:start', () => {
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
      groupOpen = true

      spinner.start('Parsing spec')
    })

    onRun('kubb:generation:end', async ({ diagnostics = [] }) => {
      spinner.stop()
      progress.stop()
      problems.state.diagnostics = diagnostics
      await problems.flush()
    })

    hook('kubb:lifecycle:end', async () => {
      await problems.flush()
      closeGroup('failed')
      reset()
    })

    const renderSummary: SummaryRenderer = (lines, { status }) => {
      if (silent || !groupOpen) {
        return
      }

      spinner.stop()
      progress.stop()
      if (human) closeGroup(status)
      groupOpen = false
      writer.diagnostic([...lines])
    }

    return {
      /** Whether a config's group is open, so a problem can wait for its end. */
      get groupOpen(): boolean {
        return groupOpen
      },
      renderSummary,
    }
  })
}
