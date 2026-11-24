import { toError } from '@internals/utils'
import { InvalidAgentTokenError, refreshAgentToken } from '@kubb/studio'
import { type Credentials, getMachineId, updateCredentials } from './credentials.ts'

const REFRESH_EVERY_MS = 24 * 60 * 60 * 1000

export type TokenRefresher = {
  refresh: (options?: { force?: boolean }) => Promise<boolean>
  stop: () => void
}

/** Refreshes the token now when it is a day old, then once a day until `stop`. `credentials` reads and replaces the connection's credentials. */
export async function startTokenRefresher({
  studioUrl,
  signal,
  warn,
  credentials,
}: {
  studioUrl: string
  signal: AbortSignal
  warn: (message: string) => void
  credentials: { get: () => Credentials; set: (credentials: Credentials) => void }
}): Promise<TokenRefresher> {
  // Resolves whether the token changed; a failure keeps the old one.
  const refreshToken = async (force: boolean): Promise<boolean> => {
    if (!force && Date.now() - Date.parse(credentials.get().issuedAt ?? '') < REFRESH_EVERY_MS) return false
    const replaced = credentials.get().token
    try {
      const token = await refreshAgentToken({
        studioUrl,
        token: replaced,
        machineId: await getMachineId(),
        privateKey: credentials.get().privateKey,
        signal,
      })
      // A pairing that finished meanwhile owns the credentials now.
      if (!token || credentials.get().token !== replaced) return false
      const refreshed = { token, issuedAt: new Date().toISOString() }
      credentials.set({ ...credentials.get(), ...refreshed })
      // Only the token changes on disk, so permissions saved since this run read the file are kept.
      await updateCredentials((stored) => (stored?.token === replaced ? { ...stored, ...refreshed } : undefined)).catch((error: unknown) =>
        warn(`Could not store the refreshed token: ${toError(error).message}`),
      )
      return true
    } catch (error) {
      if (!signal.aborted && !(error instanceof InvalidAgentTokenError)) warn(`Could not refresh the agent token: ${toError(error).message}`)
      return false
    }
  }
  // The timer and a rejected token share one request: two refreshes of one token cannot both succeed.
  let refreshing: Promise<boolean> | undefined
  const refresh = ({ force = false } = {}): Promise<boolean> =>
    (refreshing ??= refreshToken(force).finally(() => {
      refreshing = undefined
    }))
  await refresh()
  const timer = setInterval(() => void refresh(), REFRESH_EVERY_MS)
  timer.unref()

  return { refresh, stop: () => clearInterval(timer) }
}
