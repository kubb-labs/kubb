import { defineCommand } from '@internals/utils'
import { version } from '../../package.json'

export const command = defineCommand({
  name: 'mcp',
  description:
    'Start a Model Context Protocol (MCP) server that exposes Kubb code generation as tools for AI assistants. Once running, configure your AI client (Claude, Cursor, Windsurf, etc.) to connect to it — the assistant can then call kubb generate directly without leaving the chat.',
  examples: ['kubb mcp', '# Then add to your MCP client config:', '# { "mcpServers": { "kubb": { "command": "npx", "args": ["kubb", "mcp"] } } }'],
  async run() {
    const { runMcp } = await import('../runners/mcp.ts')

    await runMcp({ version })
  },
})
