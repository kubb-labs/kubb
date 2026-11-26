import { defineTool } from 'tmcp/tool'
import * as v from 'valibot'
import { runKubb } from '../cli.ts'

export const listTool = defineTool(
  {
    name: 'kubb_list',
    title: 'List Kubb extensions',
    description:
      'List the Kubb extensions installed in the project, with the installed version of each and the update the registry offers. Use it to find the registry id to pass to `kubb_update` or `kubb_remove`, or to check what a project generates before changing its config. It only reads: it installs nothing and changes no file. It lists installed extensions only, so it cannot search the registry for extensions to add. Runs `kubb list` and returns the CLI output and exit code.',
    schema: v.object({}),
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  },
  () => runKubb({ args: ['list'] }),
)
