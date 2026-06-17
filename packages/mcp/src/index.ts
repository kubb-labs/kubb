import { startServer } from './server.ts'

export { createMcpServer } from './server.ts'

/**
 * Entry point that starts the MCP server over stdio. The argument is accepted
 * for CLI parity but ignored.
 */
export async function run(_argv?: Array<string>): Promise<void> {
  await startServer()
}
