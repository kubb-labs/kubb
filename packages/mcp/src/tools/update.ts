import { defineTool } from 'tmcp/tool'
import * as v from 'valibot'
import { runKubb } from '../cli.ts'
import { dryRunSchema, registryIdSchema } from './shared.ts'

const updateSchema = v.object({
  ids: v.optional(v.pipe(v.array(registryIdSchema), v.description('Registry ids to update. Updates every installed extension when omitted')), []),
  dryRun: dryRunSchema,
})

export const updateTool = defineTool(
  {
    name: 'update',
    description: 'Update installed Kubb extensions to the versions the registry pins, regenerate, and summarize the file changes. Runs `kubb update --yes`.',
    schema: updateSchema,
  },
  ({ ids = [], dryRun = false }) => runKubb({ args: ['update', ...ids, '--yes', ...(dryRun ? ['--dry-run'] : [])] }),
)
