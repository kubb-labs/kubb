import { styleText } from 'node:util'
import * as prompts from '@clack/prompts'
import type { Hookable } from '@kubb/core'
import { logLevel as logLevelMap } from '@kubb/core'
import type { AgentHooks } from '@kubb/studio'
import { formatMessage } from '../../loggers/utils.ts'
import { isRichOutput } from '../../utils/env.ts'

/**
 * Writes one line through clack's gutter when the terminal can take it, and plainly otherwise.
 * Shared with `run.ts`, which frames the same session output.
 */
export function writeLine(level: 'info' | 'success' | 'warn' | 'error', message: string): void {
  if (isRichOutput()) {
    prompts.log[level](message)

    return
  }

  console.log(message)
}

/**
 * Renders the `studio:*` session events for the `kubb studio` command.
 *
 * Deliberately not a `Logger` from `../../loggers/defineLogger.ts`: those subscribe to the whole
 * generation lifecycle and own spinners and progress bars. These six events are one line each, so
 * they need a writer and nothing more. The generation half of a Studio session is rendered by the
 * real loggers, installed on the same emitter through `setupReporters`.
 */
export function installStudioLogger(
  hooks: Hookable<AgentHooks>,
  {
    logLevel,
    spinner,
  }: {
    logLevel: number
    /**
     * Covers the wait for the first connection. Absent outside a TTY, where there is nothing to
     * animate.
     */
    spinner?: ReturnType<typeof prompts.spinner>
  },
): void {
  // Only the first connection is covered by the spinner. A reconnect falls through to a written
  // line, or it would report nothing at all.
  let pending = spinner

  hooks.hook('studio:connected', ({ studioUrl }) => {
    const message = formatMessage(`Connected to ${styleText('cyan', studioUrl)}`, logLevel)

    if (pending) {
      pending.stop(message)
      pending = undefined

      return
    }

    if (logLevel > logLevelMap.silent) {
      writeLine('success', message)
    }
  })

  hooks.hook('studio:disconnected', ({ reason }) => {
    if (logLevel >= logLevelMap.warn) {
      writeLine('warn', formatMessage(`Kubb Studio ended the session (${reason})`, logLevel))
    }
  })

  hooks.hook('studio:command:start', ({ command }) => {
    if (logLevel > logLevelMap.silent) {
      writeLine('info', formatMessage(`Kubb Studio asked to ${styleText('bold', command)}`, logLevel))
    }
  })

  hooks.hook('studio:command:end', ({ command, info }) => {
    if (logLevel > logLevelMap.silent) {
      writeLine('success', formatMessage(`Finished ${command}${info ? ` ${styleText('dim', `(${info})`)}` : ''}`, logLevel))
    }
  })

  hooks.hook('studio:warn', ({ message }) => {
    if (logLevel >= logLevelMap.warn) {
      writeLine('warn', formatMessage(message, logLevel))
    }
  })

  // Unguarded on purpose, matching `clackLogger`: a failure stays visible even at silent, or the
  // command dies without saying why.
  hooks.hook('studio:error', ({ error }) => {
    pending?.stop(formatMessage('Could not reach Kubb Studio', logLevel))
    pending = undefined

    writeLine('error', formatMessage(error.message, logLevel))
  })
}
