import path from 'node:path'
import { createRequire } from 'node:module'

import type { Config, ServerEvents } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'

export type { HealthResponse, InfoResponse, ServerEvents, SseEvent, SseEventType, SseEvents } from '@kubb/core'

export interface AgentOptions {
  port: number
  host: string
  configPath: string
  config: Config
  events: AsyncEventEmitter<ServerEvents>
  onGenerate: () => Promise<void>
}

/**
 * Get the pre-built Nitro server listener
 * Dynamically imports the Nitro listener from the agent package's .output directory
 * @internal
 */
export async function getListener() {
  const require = createRequire(import.meta.url)
  // Resolve the agent package location through module resolution
  const agentPkgPath = require.resolve('@kubb/agent/package.json')
  const agentRoot = path.dirname(agentPkgPath)
  const serverDir = path.join(agentRoot, '.output', 'server')

  try {
    const mod = await import(path.join(serverDir, 'index.mjs'))
    return mod.default || mod
  } catch (error) {
    console.error('Failed to load pre-built Nitro server.')
    console.error('Please ensure @kubb/agent is built by running: pnpm install')
    throw error
  }
}
