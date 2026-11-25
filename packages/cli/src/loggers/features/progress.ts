import { relative } from 'node:path'
import { styleText } from 'node:util'
import { logLevel as logLevelMap } from '@kubb/core'
import { pluralize } from '../../ui/text.ts'
import type { WriterProgress } from '../types.ts'
import type { LoggerContext } from './context.ts'
import type { Spinner } from './spinner.ts'

type ProgressState = {
  progress: WriterProgress | null
  totalFiles: number
  processedFiles: number
  /**
   * Whether this run keeps its files in memory, as a `kubb studio` run without `--allow-write` does.
   */
  inMemory: boolean
}

/**
 * The progress bar over the file writes, and the counts the summary line shows.
 */
export class Progress {
  readonly state: ProgressState = { progress: null, totalFiles: 0, processedFiles: 0, inMemory: false }
  readonly #ctx: LoggerContext

  constructor({ ctx, spinner }: { ctx: LoggerContext; spinner: Spinner }) {
    this.#ctx = ctx
    const { writer, silent, human, logLevel, text, onRun } = ctx
    const { state } = this
    if (silent) {
      return
    }

    // Plain output prints every advance as its own line, so it names each file only at the verbose level.
    const nameFiles = human || logLevel >= logLevelMap.verbose

    onRun('kubb:files:processing:start', ({ files }) => {
      spinner.stop()
      state.totalFiles = files.length
      state.processedFiles = 0

      state.progress = writer.progress(files.length)
      state.progress.start(text(`${state.inMemory ? 'Generating' : 'Writing'} ${pluralize(files.length, 'file')}`))
    })

    onRun('kubb:files:processing:update', ({ files }) => {
      for (const { file, config } of files) {
        state.processedFiles++
        if (nameFiles) state.progress?.advance(`${state.inMemory ? 'Generating' : 'Writing'} ${relative(config.root, file.path)}`)
      }
    })

    onRun('kubb:files:processing:end', ({ files, unchanged }) => {
      const skipped = unchanged.length ? styleText('dim', ` · ${unchanged.length} unchanged`) : ''
      this.stop(
        state.inMemory
          ? `Generated ${pluralize(state.processedFiles, 'file')} in memory`
          : `Wrote ${pluralize(files.length - unchanged.length, 'file')}${skipped}`,
      )
    })
  }

  stop(message?: string): void {
    const { progress } = this.state
    if (!progress) {
      return
    }
    this.state.progress = null
    progress.stop(message === undefined ? '' : this.#ctx.text(message))
  }

  reset(): void {
    this.stop()
    Object.assign(this.state, { totalFiles: 0, processedFiles: 0, inMemory: false })
  }
}

export function createProgress(options: { ctx: LoggerContext; spinner: Spinner }): Progress {
  return new Progress(options)
}
