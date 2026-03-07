import { defineCommand } from '../cli/index.ts'
import { version } from '../../package.json'
import { runMcp } from '../runners/mcp.ts'

export const command = defineCommand({
  name: 'mcp',
  description: 'Start the server to enable the MCP client to interact with the LLM.',
  async run() {
    await runMcp({ version })
  },
})
