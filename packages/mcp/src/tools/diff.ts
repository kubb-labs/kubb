import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import * as v from 'valibot'
import { runKubb } from '../cli.ts'
import { configSchema, toConfigArgs } from './shared.ts'

const diffSchema = v.object({
  config: configSchema,
  lockfile: v.optional(v.pipe(v.boolean(), v.description('Read kubb-lock.json. Set to false to compare with the generated text alone')), true),
})

export const diffTool = defineTool(
  {
    name: 'diff',
    description:
      'Show what `generate` would change without writing files: a unified diff for each generated file that is out of date. Runs `kubb generate --diff`. Exit code 0 means up to date, 1 means out of date.',
    schema: diffSchema,
  },
  async ({ config, lockfile = true }) => {
    const configArgs = await toConfigArgs(config)
    if ('error' in configArgs) return tool.error(configArgs.error)
    // `--check` exits with 1 when files are out of date, which is the answer, not a failure. A failed run exits with 2.
    return runKubb(['generate', ...configArgs.args, '--diff', ...(lockfile ? [] : ['--no-lockfile'])], { isSuccess: (code) => code === 0 || code === 1 })
  },
)
