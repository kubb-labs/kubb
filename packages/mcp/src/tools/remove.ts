import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import * as v from 'valibot'
import { runKubb } from '../cli.ts'
import { configSchema, dryRunSchema, registryIdSchema, toConfigArgs } from './shared.ts'

const removeSchema = v.object({
  id: registryIdSchema,
  config: configSchema,
  uninstall: v.optional(v.pipe(v.boolean(), v.description('Uninstall the package. Set to false to only edit the config')), true),
  dryRun: dryRunSchema,
})

export const removeTool = defineTool(
  {
    name: 'remove',
    description: 'Remove a plugin or parser from kubb.config.ts and uninstall its package. Runs `kubb remove <id> --yes`.',
    schema: removeSchema,
  },
  async ({ id, config, uninstall = true, dryRun = false }) => {
    const configArgs = await toConfigArgs(config)
    if ('error' in configArgs) return tool.error(configArgs.error)
    return runKubb({ args: ['remove', id, ...configArgs.args, '--yes', ...(uninstall ? [] : ['--no-uninstall']), ...(dryRun ? ['--dry-run'] : [])] })
  },
)
