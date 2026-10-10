import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { IncompatibleAgentError, InvalidAgentTokenError } from '../operations/api.ts'
import { agentDefaults } from '../operations/constants.ts'
import { StudioSession, type StudioSessionOptions } from './StudioSession.ts'

type ConnectionOutcome = 'shutdown' | 'stopped'

type TokenRejection<TCredentials> = {
  error: InvalidAgentTokenError
  credentials: TCredentials
  /** Whether this credential already served a ready session. */
  live: boolean
}

export type ConnectionOptions<TCredentials extends { token: string }> = {
  credentials: TCredentials
  clientOptions: (credentials: TCredentials) => Omit<StudioSessionOptions, 'token' | 'signal'>
  onTokenRejected: (rejection: TokenRejection<TCredentials>) => Promise<TCredentials | null>
  signal?: AbortSignal
  /** Used by the client facade once startup succeeds or schedules its first retry. */
  onStarted?: () => void
}

/** Runs the process's one connection loop, including retries and credential replacement. */
export async function runConnection<TCredentials extends { token: string }>({
  credentials,
  clientOptions,
  onTokenRejected,
  signal,
  onStarted,
}: ConnectionOptions<TCredentials>): Promise<ConnectionOutcome> {
  let current = credentials
  const initialOptions = clientOptions(current)
  const instanceId = initialOptions.instanceId ?? randomUUID()
  let options = initialOptions
  let attempt = 0
  let live = false

  while (!signal?.aborted) {
    const session = new StudioSession({ ...options, instanceId, token: current.token, signal })
    try {
      await session.start()
      live = true
      attempt = 0
      onStarted?.()
      const end = await session.closed
      if (!end.retry) return signal?.aborted ? 'shutdown' : 'stopped'
    } catch (error) {
      if (signal?.aborted) return 'shutdown'
      if (error instanceof IncompatibleAgentError) throw error
      await session.dispose()
      const end = await session.closed
      // A terminal socket close during the handshake must not become a network retry.
      if (!end.retry && end.reason !== 'shutdown') return 'stopped'
      if (error instanceof InvalidAgentTokenError) {
        const next = await onTokenRejected({ error, credentials: current, live })
        if (!next) return 'stopped'
        current = next
        options = clientOptions(current)
        live = false
        attempt = 0
        continue
      }
    } finally {
      await session.dispose()
    }

    onStarted?.()
    const cap = Math.min(1_000 * 2 ** Math.min(attempt++, 16), options.retryInterval ?? agentDefaults.retryIntervalMs)
    const delayMs = Math.random() * cap
    await session.reportRetry(delayMs)
    try {
      await delay(delayMs, undefined, { signal })
    } catch (error) {
      if (!signal?.aborted) throw error
    }
  }
  return 'shutdown'
}
