import { styleText } from 'node:util'
import { formatMs, getElapsedMs } from '@internals/utils'
import { logOutro } from './intro.ts'

export type SummaryStatus = 'success' | 'failed' | 'warning' | 'planned' | 'canceled'

export function createSummary(hrStart: [number, number]): (title: string, status: SummaryStatus, lines: ReadonlyArray<string>) => void {
  return (title, status, lines) => logCommandSummary({ title, status, hrStart, block: true, lines })
}

/**
 * Finishes a command with the labeled details, then its outcome and duration, so the outcome is the last thing printed.
 * A command with prompts closes its existing block; validation writes a standalone summary.
 */
export function logCommandSummary({
  title,
  status,
  hrStart,
  lines,
  block = false,
}: {
  title: string
  status: SummaryStatus
  hrStart: [number, number]
  lines: ReadonlyArray<string>
  block?: boolean
}): void {
  const colors = { success: 'green', failed: 'red', warning: 'yellow', planned: 'cyan', canceled: 'dim' } as const
  const symbols = { success: '✓', failed: '✗', warning: '!', planned: '◇', canceled: '○' } as const
  // Details first and the verdict last, the way `oxlint` and `pnpm` end a run.
  const details = lines.length ? [...lines, ''] : []
  const verdict = styleText(colors[status], `${symbols[status]} ${title}`)
  const summary = [...details, verdict, `  ${styleText('dim', `Finished in ${formatMs(getElapsedMs(hrStart))}`)}`].join('\n')
  if (block) {
    logOutro(summary)
    return
  }
  if (status === 'failed') {
    console.error(summary)
    return
  }
  console.log(summary)
}
