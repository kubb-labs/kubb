import { define } from 'gunshi'

/**
 * The runner is imported when the command runs, so listing `kubb --help` never loads `@kubb/mcp`.
 */
export const command = define({
  name: 'mcp',
  description:
    'Start a Model Context Protocol (MCP) server that exposes Kubb code generation as tools for AI assistants. Once running, configure your AI client (Claude, Cursor, Windsurf, etc.) to connect to it — the assistant can then call kubb generate directly without leaving the chat.',
  examples: ['kubb mcp', '# Then add to your MCP client config:', '# { "mcpServers": { "kubb": { "command": "npx", "args": ["kubb", "mcp"] } } }'].join('\n'),
  async run() {
    const { run } = await import('../runners/mcp/run.ts')
    await run()
  },
})
