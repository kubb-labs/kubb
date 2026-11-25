import { styleText } from 'node:util'
import type { SummaryRenderer } from '@kubb/core'
import type { LogStatus } from '../types.ts'
import { getInputPath, type LoggerContext } from './context.ts'
import type { Phases } from './phases.ts'
import type { Printer } from './printer.ts'
import type { Progress } from './progress.ts'
import type { Spinner } from './spinner.ts'
import type { Walk } from './walk.ts'

/**
 * One config's run: the group it opens, the state every feature resets at its start, and the
 * closing line, which the lifecycle end draws too for a run that threw before its summary.
 */
class Generation {
  readonly #options: ConstructorParameters<typeof Generation>[0]

  constructor(options: { ctx: LoggerContext; spinner: Spinner; progress: Progress; walk: Walk; phases: Phases; problems: Printer }) {
    this.#options = options
    const { ctx, spinner, progress, walk, problems } = options
    const { writer, silent, text, hooks, onRun } = ctx

    hooks.hook('kubb:lifecycle:start', () => {
      this.#reset()
    })

    onRun('kubb:generation:start', ({ config }) => {
      this.#closeGroup('failed')
      this.#reset()

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
      this.#closeGroup('failed')
      this.#reset()
    })
  }

  #reset(): void {
    const { spinner, progress, walk, phases, problems } = this.#options
    spinner.reset()
    progress.reset()
    walk.reset()
    phases.reset()
    problems.reset()
  }

  // A run that throws before `kubb:generation:end` never reaches the summary, so the lifecycle
  // end calls this too rather than leave a group without its closing line.
  #closeGroup(status: LogStatus): void {
    const { ctx, spinner, progress, problems } = this.#options
    if (!ctx.groupOpen) {
      return
    }
    ctx.groupOpen = false

    spinner.stop()
    progress.stop()
    ctx.writer.groupEnd(status === 'failed' ? styleText('red', problems.failedTitle()) : styleText('green', '✓ Generation succeeded'))
  }

  // An arrow function, because the `cli` reporter calls it without the instance.
  renderSummary: SummaryRenderer = (lines, { status }) => {
    const { ctx, spinner, progress } = this.#options
    if (ctx.silent || !ctx.groupOpen) {
      return
    }

    spinner.stop()
    progress.stop()
    if (ctx.human) this.#closeGroup(status)
    ctx.groupOpen = false
    ctx.writer.diagnostic([...lines])
  }
}

export function createGeneration(options: ConstructorParameters<typeof Generation>[0]): { renderSummary: SummaryRenderer } {
  return new Generation(options)
}
