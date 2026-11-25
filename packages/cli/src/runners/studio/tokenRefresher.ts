import { toError } from '@internals/utils'
import { InvalidAgentTokenError, refreshAgentToken } from '@kubb/studio'
import { type Credentials, getMachineId, updateCredentials } from './credentials.ts'

const REFRESH_EVERY_MS = 24 * 60 * 60 * 1000

export type TokenRefresherOptions = {
  studioUrl: string
  signal: AbortSignal
  warn: (message: string) => void
  credentials: { get: () => Credentials; set: (credentials: Credentials) => void }
}

export class TokenRefresher {
  readonly #options: TokenRefresherOptions
  // The timer and a rejected token share one request: two refreshes of one token cannot both succeed.
  #refreshing: Promise<boolean> | undefined
  #timer: NodeJS.Timeout | undefined

  constructor(options: TokenRefresherOptions) {
    this.#options = options
  }

  refresh({ force = false } = {}): Promise<boolean> {
    return (this.#refreshing ??= this.#refreshToken(force).finally(() => {
      this.#refreshing = undefined
    }))
  }

  start(): void {
    this.#timer = setInterval(() => void this.refresh(), REFRESH_EVERY_MS)
    this.#timer.unref()
  }

  stop(): void {
    clearInterval(this.#timer)
  }

  // Resolves whether the token changed; a failure keeps the old one.
  async #refreshToken(force: boolean): Promise<boolean> {
    const { studioUrl, signal, warn, credentials } = this.#options
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
}

/** Refreshes the token now when it is a day old, then once a day until `stop`. `credentials` reads and replaces the connection's credentials. */
export async function startTokenRefresher(options: TokenRefresherOptions): Promise<TokenRefresher> {
  const refresher = new TokenRefresher(options)
  await refresher.refresh()
  refresher.start()
  return refresher
}
