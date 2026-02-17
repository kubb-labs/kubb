import type { KubbFile } from '@kubb/fabric-core/types'
import type { Config, KubbEvents } from '../types.ts'

/**
 * Typed SSE events sent by the Kubb server.
 * Follows the same tuple structure as {@link KubbEvents}.
 * Reusable in consumers like kubb-playground to parse incoming events.
 */
export interface SseEvents {
  'plugin:start': [plugin: { name: string }]
  'plugin:end': [plugin: { name: string }, meta: { duration: number; success: boolean }]
  'files:processing:start': [meta: { total: number }]
  'file:processing:update': [
    meta: {
      file: string
      processed: number
      total: number
      percentage: number
    },
  ]
  'files:processing:end': [meta: { total: number }]
  info: [message: string, info?: string]
  success: [message: string, info?: string]
  warn: [message: string, info?: string]
  error: [error: { message: string; stack?: string }]
  'generation:start': [config: { name?: string; plugins: number }]
  'generation:end': [Config: Config, files: Array<KubbFile.ResolvedFile>, sources: Record<KubbFile.Path, string>]
  'lifecycle:end': []
}

export type SseEventType = keyof SseEvents

export type SseEvent<T extends SseEventType = SseEventType> = {
  type: T
  data: SseEvents[T]
  timestamp: number
}

/**
 * API response types for the Kubb stream server endpoints.
 */

/** GET /api/health */
export type HealthResponse = {
  status: 'ok'
  version: string
  configPath: string
}

/** GET /api/info */
export type InfoResponse = {
  version: string
  configPath: string
  spec?: string
  config: {
    name?: string
    root: string
    input: {
      path?: string
    }
    output: {
      path: string
      write?: boolean
      extension?: Record<string, string>
      barrelType?: string | false
    }
    plugins?: Array<{
      name: string
      options: unknown
    }>
  }
}

/**
 * Same events as KubbEvents but with server lifecycle events
 */
export type ServerEvents = KubbEvents & {
  /**
   * Emitted when the server starts successfully
   */
  'server:start': [serverUrl: string, configPath: string]
  /**
   * Emitted when the server is shutting down
   */
  'server:shutdown': []
  /**
   * Emitted when the server has stopped
   */
  'server:stopped': []
}
