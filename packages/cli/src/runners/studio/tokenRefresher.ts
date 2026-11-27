import { toError } from '@internals/utils'
import { InvalidAgentTokenError, renewAgentToken } from '@kubb/studio'
import { type Credentials, getMachineId, updateCredentials } from './credentials.ts'

/**
 * How often a token without an expiry is traded in.
 */
const REFRESH_EVERY_MS = 24 * 60 * 60 * 1000

/**
 * The share of an expiring token's lifetime after which it is refreshed. The point is picked at
 * random in this range for each token, so many agents paired at once do not refresh at once.
 */
export const REFRESH_WINDOW = { min: 0.7, max: 0.85 } as const

/**
 * Bounds for the wait before another try, after a refresh of an expiring token failed.
 */
const RETRY_MIN_MS = 5_000
const RETRY_MAX_MS = 60_000

export type TokenRefresherOptions = {
  studioUrl: string
  signal: AbortSignal
  warn: (message: string) => void
  credentials: { get: () => Credentials; set: (credentials: Credentials) => void }
  /**
   * Source of the jitter, a number in `[0, 1)`.
   *
   * @default Math.random
   */
  random?: () => number
}

/**
 * When `credentials` expires, in epoch milliseconds, or `undefined` for a token with no expiry.
 */
function getExpiresAt(credentials: Credentials): number | undefined {
  const expiresAt = Date.parse(credentials.expiresAt ?? '')
  return Number.isFinite(expiresAt) ? expiresAt : undefined
}

export class TokenRefresher {
  readonly #options: TokenRefresherOptions
  // The timer and a rejected token share one request: two refreshes of one token cannot both succeed.
  #refreshing: Promise<boolean> | undefined
  #timer: NodeJS.Timeout | undefined
  #stopped = false
  // The point in its lifetime at which the current token is refreshed, picked once per token.
  #jitter: { token: string; share: number } | undefined

  constructor(options: TokenRefresherOptions) {
    this.#options = options
  }

  refresh({ force = false } = {}): Promise<boolean> {
    return (this.#refreshing ??= this.#refreshToken(force).finally(() => {
      this.#refreshing = undefined
    }))
  }

  /**
   * Schedules the next refresh. A token with an expiry is refreshed at 70 to 85 percent of its
   * lifetime, and a token without one once a day.
   */
  start(): void {
    this.#stopped = false
    this.#schedule(this.#nextDelay())
  }

  stop(): void {
    this.#stopped = true
    clearTimeout(this.#timer)
  }

  /**
   * When the current token is due, in epoch milliseconds.
   */
  dueAt(): number {
    const credentials = this.#options.credentials.get()
    const issuedAt = Date.parse(credentials.issuedAt ?? '')
    // A token stored by a release without refresh has no issue date, so it is due now.
    if (!Number.isFinite(issuedAt)) return 0
    const expiresAt = getExpiresAt(credentials)
    if (expiresAt === undefined) return issuedAt + REFRESH_EVERY_MS

    return issuedAt + Math.ceil(Math.max(0, expiresAt - issuedAt) * this.#share(credentials.token))
  }

  #share(token: string): number {
    if (this.#jitter?.token !== token) {
      const random = this.#options.random ?? Math.random
      this.#jitter = { token, share: REFRESH_WINDOW.min + (REFRESH_WINDOW.max - REFRESH_WINDOW.min) * random() }
    }
    return this.#jitter.share
  }

  #nextDelay(): number {
    const now = Date.now()
    const due = this.dueAt() - now
    if (due > 0) return due
    // Still due: the last try failed, or Studio had nothing to refresh.
    const expiresAt = getExpiresAt(this.#options.credentials.get())
    if (expiresAt === undefined || expiresAt <= now) return REFRESH_EVERY_MS

    return Math.min(RETRY_MAX_MS, Math.max(RETRY_MIN_MS, (expiresAt - now) / 2))
  }

  #schedule(delay: number): void {
    clearTimeout(this.#timer)
    if (this.#stopped || this.#options.signal.aborted) return
    this.#timer = setTimeout(() => {
      void this.refresh().finally(() => this.#schedule(this.#nextDelay()))
    }, delay)
    this.#timer.unref()
  }

  // Resolves whether the token changed; a failure keeps the old one.
  async #refreshToken(force: boolean): Promise<boolean> {
    const { studioUrl, signal, warn, credentials } = this.#options
    if (!force && Date.now() < this.dueAt()) return false
    const replaced = credentials.get().token
    try {
      const renewed = await renewAgentToken({
        studioUrl,
        token: replaced,
        machineId: await getMachineId(),
        privateKey: credentials.get().privateKey,
        signal,
      })
      // A pairing that finished meanwhile owns the credentials now.
      if (!renewed || credentials.get().token !== replaced) return false
      const issuedAt = Date.now()
      const refreshed = {
        token: renewed.token,
        issuedAt: new Date(issuedAt).toISOString(),
        expiresAt: renewed.expiresIn === undefined ? undefined : new Date(issuedAt + renewed.expiresIn * 1000).toISOString(),
      }
      credentials.set({ ...credentials.get(), ...refreshed })
      // Only the token changes on disk, so permissions saved since this run read the file are kept.
      await updateCredentials((stored) => (stored?.token === replaced ? { ...stored, ...refreshed } : undefined)).catch((error: unknown) =>
        warn(`Could not store the refreshed token: ${toError(error).message}`),
      )
      if (this.#timer) this.#schedule(this.#nextDelay())
      return true
    } catch (error) {
      if (!signal.aborted && !(error instanceof InvalidAgentTokenError)) warn(`Could not refresh the agent token: ${toError(error).message}`)
      return false
    }
  }
}

/**
 * Refreshes the token now when it is due, then again each time it comes due until `stop`.
 * `credentials` reads and replaces the connection's credentials.
 */
export async function startTokenRefresher(options: TokenRefresherOptions): Promise<TokenRefresher> {
  const refresher = new TokenRefresher(options)
  await refresher.refresh()
  refresher.start()
  return refresher
}
