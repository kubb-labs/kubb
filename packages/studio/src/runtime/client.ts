import type { InvalidAgentTokenError } from '../operations/api.ts'
import type { StudioSessionOptions } from './StudioSession.ts'
import { runConnection } from './runConnection.ts'

export type ClientOptions = Omit<StudioSessionOptions, 'signal'> & {
  /** Called once when a background reconnect rejects the credential. */
  onAuthRequired?: (error: InvalidAgentTokenError) => void
}

export type Client = {
  connect: () => Promise<void>
  disconnect: () => void
}

/** Compatibility facade over the shared connection loop. */
export function createClient({ onAuthRequired, ...options }: ClientOptions): Client {
  const shutdown = new AbortController()
  const started = Promise.withResolvers<void>()
  let resolved = false
  let running: Promise<unknown> | undefined

  return {
    connect() {
      running ??= runConnection({
        credentials: { token: options.token },
        clientOptions: () => options,
        signal: shutdown.signal,
        onStarted: () => {
          resolved = true
          started.resolve()
        },
        onTokenRejected: async ({ error }) => {
          if (!resolved) throw error
          onAuthRequired?.(error)
          return null
        },
      }).then(
        () => started.resolve(),
        (error: unknown) => started.reject(error),
      )
      return started.promise
    },
    disconnect() {
      shutdown.abort()
    },
  }
}
