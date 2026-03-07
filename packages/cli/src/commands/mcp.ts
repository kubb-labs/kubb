import type { ArgsDef } from 'citty'
import { defineCommand, showUsage } from 'citty'
import { version } from '../../package.json'
import { runMcp } from '../runners/mcp.ts'

const args = {
  help: {
    type: 'boolean',
    description: 'Show help',
    alias: 'h',
    default: false,
  },
} as const satisfies ArgsDef

export const command = defineCommand({
  meta: {
    name: 'mcp',
    description: 'Start the server to enable the MCP client to interact with the LLM.',
  },
  args,
  async run({ args }) {
    if (args.help) {
      return showUsage(command)
    }

    await runMcp({ version })
  },
})

