import process from 'node:process'
import { styleText } from 'node:util'
import { formatMs, getElapsedMs } from '@internals/utils'
import { Diagnostics, logLevel as logLevelMap } from '@kubb/core'
import { pluralize, toPermissionFlag } from '../../ui/text.ts'
import { clock, type LoggerContext } from './context.ts'
import type { Spinner } from './spinner.ts'

/** One line of a Studio session's job log: the time, the command, who asked for it, and how it ended. */
function formatJobLine({ command, result, requestedBy }: { command: string; result: string; requestedBy?: string }): string {
  const by = requestedBy ? `${styleText('dim', `by ${requestedBy}`.padEnd(16))} ` : ''
  return `${styleText('dim', clock())}  ${command.padEnd(10)} ${by}${result}`
}

/**
 * A `kubb studio` session. It emits these on the same emitter as its generations, so one logger
 * renders the whole command: the connection, then one job line per command.
 */
export function createSession(ctx: LoggerContext, spinner: Spinner) {
  const { writer, silent, human, logLevel, text, hooks } = ctx

  hooks.hook('studio:disconnected', ({ code, reason }) => {
    if (logLevel < logLevelMap.warn) {
      return
    }

    spinner.stop()
    // 4002 is `AgentCloseCode.SUPERSEDED`, spelled out because `@kubb/studio` is an optional peer.
    if (code === 4002) {
      writer.warn(text('⚠ Another process connected to Kubb Studio as this agent, so this one stopped'))
      return
    }
    writer.warn(text(`⚠ Kubb Studio ended the session (${reason || `code ${code}`})`))
  })

  hooks.hook('studio:warn', ({ message, permission }) => {
    if (logLevel < logLevelMap.warn) {
      return
    }
    const remedy = permission ? `; pass ${toPermissionFlag(permission)} to allow it` : ''
    // A warning drawn under a running spinner leaves a stale spinner frame above it, so it pauses the spinner like a job line does.
    const paused = spinner.active
    spinner.stop()
    writer.warn(text(`⚠ ${message}${remedy}`))
    if (paused) spinner.start('Ready for jobs')
  })

  // Unguarded, like `kubb:error`: a failure stays visible even at silent.
  hooks.hook('studio:error', ({ error }) => {
    if (spinner.active) {
      spinner.stop(error.message, 'failed')
      return
    }
    writer.error(text(error.message))
  })

  if (silent) {
    return
  }

  // The last generation's outcome, for the job line `studio:command` prints after it.
  let job: { fileCount: number; ms: number; errors: number } | null = null

  hooks.hook('studio:connected', ({ url, versions: { studio, kubb, agent } }) => {
    ctx.session = human
    spinner.stop()
    // The runtime version shows only when it differs from the host's.
    const versions = [`v${agent}`, kubb !== agent ? `runtime v${kubb}` : undefined, `Studio v${studio}`].filter(Boolean).join(' · ')
    writer.success(text(`✓ Connected to ${styleText('cyan', url)} ${styleText('dim', `· ${versions}`)}`))
    spinner.start('Ready for jobs')
  })

  hooks.hook('kubb:generation:start', () => {
    if (ctx.session) spinner.message(text('Generating'))
  })

  hooks.hook('kubb:generation:end', ({ diagnostics = [], filesCreated = 0, status, hrStart = process.hrtime() }) => {
    job = { fileCount: filesCreated, ms: getElapsedMs(hrStart), errors: status === 'failed' ? Diagnostics.count(diagnostics).errors : 0 }
  })

  hooks.hook('studio:command', ({ command, info, requestedBy, failed }) => {
    spinner.stop()
    const took = command === 'generate' && job ? `${pluralize(job.fileCount, 'file')} in ${formatMs(job.ms)} ` : ''
    const result = failed
      ? `${styleText('red', '✖')} ${job?.errors ? pluralize(job.errors, 'error') : 'failed'}, see Studio`
      : `${styleText('green', '✓')} ${took}${styleText('dim', `(${info})`)}`
    writer.info(formatJobLine({ command, requestedBy, result }))
    job = null
    spinner.start('Ready for jobs')
  })

  hooks.hook('studio:reconnecting', ({ delayMs }) => {
    spinner.stop()
    writer.info(text(styleText('dim', `Retrying connection to Kubb Studio in ${formatMs(delayMs)}`)))
  })
}
