import { type Args, define } from 'gunshi'
import type { StudioOptions, StudioValues } from '../../runners/studio/run.ts'

/** Defines a `kubb studio` subcommand; the runner and `@kubb/studio` load only when it runs, never for `kubb --help`. */
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
