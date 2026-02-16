import type { Config } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import { startServer } from './server.ts'
import type { ServerEvents } from './types.ts'

export type { HealthResponse, InfoResponse, ServerEvents, SseEvent, SseEventType, SseEvents } from './types.ts'

export interface AgentOptions {
  port: number
  host: string
  configPath: string
  config: Config
  events: AsyncEventEmitter<ServerEvents>
  onGenerate: () => Promise<void>
}

export async function run(options: AgentOptions): Promise<void> {
  await startServer(options)
}
