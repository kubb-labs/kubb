import { startServer } from './server.ts'

export async function run(_argv?: string[]): Promise<void> {
  await startServer()
}
