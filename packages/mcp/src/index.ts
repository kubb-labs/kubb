import { startServer } from './server.ts'

export { createMcpServer } from './server.ts'
export type { ServerOptions } from './server.ts'

/**
 * Entry point that starts the MCP server. The first argument is accepted for
 * CLI parity but ignored, so behavior is driven entirely by `options`.
 */
export async function run(_argv?: Array<string>, options?: import('./server.ts').ServerOptions): Promise<void> {
  await startServer(options)
}
