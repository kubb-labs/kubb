import { startServer } from './server.ts'

export { createMcpServer } from './server.ts'
export type { ServerOptions } from './server.ts'

export async function run(_argv?: string[], options?: import('./server.ts').ServerOptions): Promise<void> {
  await startServer(options)
}
