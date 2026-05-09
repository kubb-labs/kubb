import { defineCommand } from '@internals/utils'
import { version } from '../../package.json'

export const command = defineCommand({
  name: 'mcp',
  description:
    'Start a Model Context Protocol (MCP) server that exposes Kubb code generation as tools for AI assistants. Once running, configure your AI client (Claude, Cursor, Windsurf, etc.) to connect to it — the assistant can then call kubb generate directly without leaving the chat.',
  examples: [
    'kubb mcp',
    'kubb mcp --port 3001',
    '# Then add to your MCP client config:',
    '# { "mcpServers": { "kubb": { "command": "npx", "args": ["kubb", "mcp"] } } }',
  ],
  options: {
    port: {
      type: 'string',
      short: 'p',
      description: 'Port for HTTP MCP server (omit for stdio)',
      hint: 'number',
    },
    host: {
      type: 'string',
      description: 'Hostname to bind to (HTTP mode only)',
      default: 'localhost',
    },
  },
  async run({ values }) {
    const { runMcp } = await import('../runners/mcp.ts')

    await runMcp({
      version,
      port: values.port,
      host: values.host,
    })
  },
})
