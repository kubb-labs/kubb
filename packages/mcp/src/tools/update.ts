import { defineTool } from 'tmcp/tool'
import * as v from 'valibot'
import { runKubb } from '../cli.ts'
import { dryRunSchema, registryIdSchema } from './shared.ts'

const updateSchema = v.object({
  extensionIds: v.optional(
    v.pipe(
      v.array(registryIdSchema),
      v.description('Registry ids to update. Updates every installed extension when omitted, but installs a major update only for an extension named here'),
    ),
    [],
  ),
  dryRun: dryRunSchema,
})

export const updateTool = defineTool(
  {
    name: 'kubb_update',
    title: 'Update Kubb extensions',
    description:
      'Update installed Kubb extensions to the versions the registry pins. Use it after `kubb_list` reports available updates, or when the user asks to upgrade Kubb plugins. Without `extensionIds` it updates every installed extension but skips major updates: a major update is installed only for an extension named in `extensionIds`. Do not use it to install an extension that is not in the project yet (use `kubb_add`). Runs `kubb update --yes` and returns the CLI output and exit code, with a summary of what was installed. It does not regenerate: call `kubb_generate` afterwards to update the generated files. Set `dryRun` to preview the updates.',
    schema: updateSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
  },
  ({ extensionIds = [], dryRun = false }) => runKubb({ args: ['update', ...extensionIds, '--yes', ...(dryRun ? ['--dry-run'] : [])] }),
)
