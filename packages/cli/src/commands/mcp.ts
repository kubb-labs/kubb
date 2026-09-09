import { define } from 'gunshi'

/**
 * Declaration only, so listing `kubb --help` never loads `@kubb/mcp`. `index.ts` pairs this
 * with the runner through gunshi's `lazy`.
 */
export const definition = define({
  name: 'mcp',
  description:
    'Start a Model Context Protocol (MCP) server that exposes Kubb code generation as tools for AI assistants. Once running, configure your AI client (Claude, Cursor, Windsurf, etc.) to connect to it — the assistant can then call kubb generate directly without leaving the chat.',
  examples: ['kubb mcp', '# Then add to your MCP client config:', '# { "mcpServers": { "kubb": { "command": "npx", "args": ["kubb", "mcp"] } } }'].join('\n'),
})
