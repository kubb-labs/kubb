import { version } from '../../package.json'
import { defineCommand } from '../cli/index.ts'

export const command = defineCommand({
  name: 'mcp',
  description: 'Start the server to enable the MCP client to interact with the LLM.',
  async run() {
    const { runMcp } = await import('../runners/mcp.ts')

    await runMcp({ version })
  },
})
