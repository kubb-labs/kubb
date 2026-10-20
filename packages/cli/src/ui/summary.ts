import { styleText } from 'node:util'
import { formatMs, getElapsedMs } from '@internals/utils'
import { logOutro } from './intro.ts'

/**
 * Finishes a command with its outcome and duration before the labeled details.
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
  status: 'success' | 'failed' | 'warning' | 'planned' | 'canceled'
  hrStart: [number, number]
  lines: ReadonlyArray<string>
  block?: boolean
}): void {
  const colors = { success: 'green', failed: 'red', warning: 'yellow', planned: 'cyan', canceled: 'dim' } as const
  const symbols = { success: '✓', failed: '✗', warning: '!', planned: '◇', canceled: '○' } as const
  const summary = [`${styleText(colors[status], `${symbols[status]} ${title}`)}  ${styleText('dim', formatMs(getElapsedMs(hrStart)))}`, '', ...lines].join('\n')
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
