import { styleText } from 'node:util'
import * as prompts from '@clack/prompts'
import type { Hookable } from '@kubb/core'
import { logLevel as logLevelMap } from '@kubb/core'
import type { AgentHooks } from '@kubb/studio'
import { getAgentName } from '../../agent.ts'
import { formatMessage } from '../../loggers/utils.ts'
import { canUseTTY } from '../../utils/env.ts'

export type StudioLoggerOptions = {
  /**
   * Numeric level from `@kubb/core`'s `logLevel` map.
   */
  logLevel: number
  /**
   * Sessions this agent serves. The session tag is only worth showing when there is more than one
   * to tell apart.
   */
  poolSize: number
  /**
   * Spinner covering the wait for the first connection, stopped on `studio:connected`. Absent
   * outside a TTY, where there is nothing to animate.
   */
  spinner?: ReturnType<typeof prompts.spinner> | null
}

/**
 * Renders the `studio:*` session events for the `kubb studio` command.
 *
 * Deliberately not a `Logger` from `../../loggers/defineLogger.ts`: those subscribe to the whole
 * generation lifecycle and own spinners and progress bars. These six events are one line each, so
 * they need a writer and nothing more. The generation half of a Studio session is rendered by the
 * real loggers, installed on the same emitter through `setupReporters`.
 */
export function installStudioLogger(hooks: Hookable<AgentHooks>, { logLevel, poolSize, spinner }: StudioLoggerOptions): void {
  // Spinners and cursor-movement escapes are hard for an AI coding agent to parse, even over a
  // pseudo-TTY, so it gets the plain writer for the same reason `setupReporters` gives it one.
  const isRich = canUseTTY() && !getAgentName()

  // One session is the default, and prefixing every line with the only tag there is adds noise.
  const prefix = (tag: string) => (poolSize > 1 ? `${styleText('dim', `[${tag}]`)} ` : '')

  // The spinner only covers the wait for the *first* connection. A reconnect has to fall through to
  // a written line instead, or it reports nothing at all.
  let pending = spinner ?? null
  const settleSpinner = (message: string): boolean => {
    if (!pending) {
      return false
    }

    pending.stop(message)
    pending = null

    return true
  }

  const write = (level: 'info' | 'success' | 'warn' | 'error', message: string) => {
    if (isRich) {
      prompts.log[level](message)

      return
    }

    const stream = level === 'error' ? console.error : console.log
    stream(message)
  }

  hooks.hook('studio:connected', ({ tag, studioUrl }) => {
    if (settleSpinner(formatMessage(`Connected to ${styleText('cyan', studioUrl)}`, logLevel))) {
      return
    }

    if (logLevel <= logLevelMap.silent) {
      return
    }

    write('success', `${prefix(tag)}${formatMessage(`Connected to ${styleText('cyan', studioUrl)}`, logLevel)}`)
  })

  hooks.hook('studio:disconnected', ({ tag, reason }) => {
    if (logLevel < logLevelMap.warn) {
      return
    }

    write('warn', `${prefix(tag)}${formatMessage(`Kubb Studio ended the session (${reason})`, logLevel)}`)
  })

  hooks.hook('studio:command:start', ({ tag, command }) => {
    if (logLevel <= logLevelMap.silent) {
      return
    }

    write('info', `${prefix(tag)}${formatMessage(`Kubb Studio asked to ${styleText('bold', command)}`, logLevel)}`)
  })

  hooks.hook('studio:command:end', ({ tag, command, info }) => {
    if (logLevel <= logLevelMap.silent) {
      return
    }

    const detail = info && logLevel >= logLevelMap.info ? ` ${styleText('dim', `(${info})`)}` : ''

    write('success', `${prefix(tag)}${formatMessage(`Finished ${command}${detail}`, logLevel)}`)
  })

  hooks.hook('studio:warn', ({ tag, message }) => {
    if (logLevel < logLevelMap.warn) {
      return
    }

    write('warn', `${prefix(tag)}${formatMessage(message, logLevel)}`)
  })

  // Unguarded on purpose, matching `clackLogger`: a failure stays visible even at silent, or the
  // command dies without saying why.
  hooks.hook('studio:error', ({ tag, error }) => {
    settleSpinner(formatMessage('Could not reach Kubb Studio', logLevel))

    write('error', `${prefix(tag)}${formatMessage(error.message, logLevel)}`)
  })
}
