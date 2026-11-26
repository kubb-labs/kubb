import { defineTool } from 'tmcp/tool'
import * as v from 'valibot'
import { runKubb } from '../cli.ts'

export const listTool = defineTool(
  {
    name: 'list',
    description: 'List the installed Kubb extensions, their versions, and available updates. Runs `kubb list`.',
    schema: v.object({}),
  },
  () => runKubb(['list']),
)
