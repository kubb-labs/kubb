import { define } from 'gunshi'

/** The runner is imported when the command runs, so listing `kubb --help` never loads `@kubb/mcp`. */
export const command = define({
  name: 'mcp',
  description: 'Start an MCP server for code generation from an AI assistant.',
  examples: ['kubb mcp', '# Then add to your MCP client config:', '# { "mcpServers": { "kubb": { "command": "npx", "args": ["kubb", "mcp"] } } }'].join('\n'),
  // gunshi prints the header to stdout, which the MCP stdio transport owns.
  rendering: { header: null },
  async run() {
    const { run } = await import('../runners/mcp/run.ts')
    await run()
  },
})
