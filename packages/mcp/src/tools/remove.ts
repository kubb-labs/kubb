import { defineTool } from 'tmcp/tool'
import * as v from 'valibot'
import { runKubb } from '../cli.ts'
import { configPathSchema, dryRunSchema, registryIdSchema } from './shared.ts'

const removeSchema = v.object({
  extensionId: registryIdSchema,
  configPath: configPathSchema,
  uninstall: v.optional(v.pipe(v.boolean(), v.description('Uninstall the package. Set to false to only edit the config')), true),
  dryRun: dryRunSchema,
})

export const removeTool = defineTool(
  {
    name: 'kubb_remove',
    title: 'Remove a Kubb extension',
    description:
      'Remove a plugin or parser from kubb.config.ts and uninstall its package. Use it when the user no longer wants the code that extension generates. It edits the config and package.json without asking, so call it with `dryRun` first when the user did not name the extension. It does not delete the files the extension generated: call `kubb_generate` afterwards, which removes them when the config sets `output.clean`. Do not use it to change the version of an extension (use `kubb_update`). Runs `kubb remove <id> --yes` and returns the CLI output and exit code.',
    schema: removeSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
  },
  ({ extensionId, configPath, uninstall = true, dryRun = false }) =>
    runKubb({ args: ['remove', extensionId, '--yes', ...(uninstall ? [] : ['--no-uninstall']), ...(dryRun ? ['--dry-run'] : [])], configPath }),
)
