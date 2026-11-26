import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import * as v from 'valibot'
import { runKubb } from '../cli.ts'
import { configPathSchema, dryRunSchema, registryIdSchema, toConfigArgs } from './shared.ts'

const addSchema = v.object({
  extensionId: registryIdSchema,
  configPath: configPathSchema,
  install: v.optional(v.pipe(v.boolean(), v.description('Install the package. Set to false to only edit the config')), true),
  dryRun: dryRunSchema,
})

export const addTool = defineTool(
  {
    name: 'kubb_add',
    title: 'Add a Kubb extension',
    description:
      'Install a plugin, adapter, or parser from the Kubb registry at the version the registry pins, and add it to kubb.config.ts with the plugins it needs. Use it to add a generator to a project, such as plugin-ts for types or plugin-zod for schemas, after `kubb_init` or when the user asks for a new kind of output. Do not use it to upgrade an extension that is already installed (use `kubb_update`), and it does not generate code: call `kubb_generate` afterwards. Runs `kubb add <id> --yes` and returns the CLI output and exit code. An adapter is not written to the config: the output holds a snippet to add by hand. Set `dryRun` to preview the change.',
    schema: addSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ extensionId, configPath, install = true, dryRun = false }) => {
    const configArgs = await toConfigArgs(configPath)
    if ('error' in configArgs) return tool.error(configArgs.error)
    return runKubb({ args: ['add', extensionId, ...configArgs.args, '--yes', ...(install ? [] : ['--no-install']), ...(dryRun ? ['--dry-run'] : [])] })
  },
)
