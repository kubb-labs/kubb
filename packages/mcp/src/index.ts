import { startServer } from './server.ts'

export { createMcpServer } from './server.ts'

/**
 * Entry point that starts the MCP server over stdio.
 */
export async function run(): Promise<void> {
  await startServer()
}
