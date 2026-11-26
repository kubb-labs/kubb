import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import * as v from 'valibot'
import { runKubb } from '../cli.ts'
import { configSchema, dryRunSchema, registryIdSchema, toConfigArgs } from './shared.ts'

const addSchema = v.object({
  id: registryIdSchema,
  config: configSchema,
  install: v.optional(v.pipe(v.boolean(), v.description('Install the package. Set to false to only edit the config')), true),
  dryRun: dryRunSchema,
})

export const addTool = defineTool(
  {
    name: 'add',
    description:
      'Install a plugin, adapter, or parser from the Kubb registry and add it to kubb.config.ts, with the plugins it needs. Runs `kubb add <id> --yes`.',
    schema: addSchema,
  },
  async ({ id, config, install = true, dryRun = false }) => {
    const configArgs = await toConfigArgs(config)
    if ('error' in configArgs) return tool.error(configArgs.error)
    return runKubb({ args: ['add', id, ...configArgs.args, '--yes', ...(install ? [] : ['--no-install']), ...(dryRun ? ['--dry-run'] : [])] })
  },
)
