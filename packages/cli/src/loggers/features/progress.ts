import { relative } from 'node:path'
import { styleText } from 'node:util'
import { logLevel as logLevelMap } from '@kubb/core'
import { pluralize } from '../../ui/text.ts'
import type { WriterProgress } from '../types.ts'
import type { LoggerContext } from './context.ts'
import type { Spinner } from './spinner.ts'

export type Progress = ReturnType<typeof createProgress>

/** The progress bar over the file writes, and the counts the summary line shows. */
export function createProgress({ writer, silent, human, logLevel, text, onRun }: LoggerContext, spinner: Spinner) {
  // Plain output prints every advance as its own line, so it names each file only at the verbose level.
  const nameFiles = human || logLevel >= logLevelMap.verbose
  const state = {
    progress: null as WriterProgress | null,
    totalFiles: 0,
    processedFiles: 0,
    /** Whether this run keeps its files in memory, as a `kubb studio` run without `--allow-write` does. */
    inMemory: false,
  }

  function stop(message?: string) {
    const progress = state.progress
    if (!progress) {
      return
    }
    state.progress = null
    progress.stop(message === undefined ? '' : text(message))
  }

  if (!silent) {
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
      stop(
        state.inMemory
          ? `Generated ${pluralize(state.processedFiles, 'file')} in memory`
          : `Wrote ${pluralize(files.length - unchanged.length, 'file')}${skipped}`,
      )
    })
  }

  return {
    state,
    stop,
    reset() {
      stop()
      Object.assign(state, { totalFiles: 0, processedFiles: 0, inMemory: false })
    },
  }
}
