import { type Args, define } from 'gunshi'
import type { StudioOptions, StudioValues } from '../../runners/studio/run.ts'

/**
 * Defines a `kubb studio` subcommand. The runner, and with it `@kubb/studio`, loads only when the
 * command runs, so `kubb --help` never does.
 */
export function studioCommand({
  action,
  block,
  ...definition
}: {
  name: string
  description: string
  examples?: string
  args?: Args
  /** Opens a block a later `logOutro` closes, for a command that keeps running. */
  block?: boolean
  /** The command body, given the options built from its flags. */
  action: (options: StudioOptions) => Promise<unknown>
}) {
  return define({
    ...definition,
    toKebab: true,
    async run({ values }) {
      const { runStudio } = await import('../../runners/studio/run.ts')
      await runStudio(values as StudioValues, action, { block })
    },
  })
}
