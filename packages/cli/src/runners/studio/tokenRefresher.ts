import { toError } from '@internals/utils'
import { InvalidAgentTokenError, renewAgentToken, type RenewedAgentToken } from '@kubb/studio'
import { type Credentials, getMachineId, updateCredentials } from './credentials.ts'

const REFRESH_EVERY_MS = 24 * 60 * 60 * 1000

/** Share of an expiring token's lifetime after which it is refreshed, picked at random per token so agents spread out. */
export const REFRESH_WINDOW = { min: 0.7, max: 0.85 } as const

/** Bounds for the wait before another try after a failed refresh of an expiring token. */
const RETRY_MIN_MS = 5_000
const RETRY_MAX_MS = 60_000

export type TokenRefresherOptions = {
  studioUrl: string
  signal: AbortSignal
  warn: (message: string) => void
  credentials: { get: () => Credentials; set: (credentials: Credentials) => void }
}

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
  #jitter: { token: string; share: number } | undefined
  // Writes run one after another, so a later token never lands under an earlier one.
  #writes: Promise<void> = Promise.resolve()
  // The last token known to be on disk. A write whose predecessor failed to land replaces this one instead.
  #onDisk: string

  constructor(options: TokenRefresherOptions) {
    this.#options = options
    this.#onDisk = options.credentials.get().token
  }

  refresh({ force = false } = {}): Promise<boolean> {
    return (this.#refreshing ??= this.#refreshToken(force).finally(() => {
      this.#refreshing = undefined
    }))
  }

  /** Schedules the next refresh: within {@link REFRESH_WINDOW} of an expiring token's lifetime, else daily. */
  start(): void {
    this.#schedule(this.#nextDelay())
  }

  stop(): void {
    this.#stopped = true
    clearTimeout(this.#timer)
  }

  /** Resolves once every refreshed token so far is on disk. */
  written(): Promise<void> {
    return this.#writes
  }

  // When the current token is due, in epoch milliseconds.
  #dueAt(): number {
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
      this.#jitter = { token, share: REFRESH_WINDOW.min + (REFRESH_WINDOW.max - REFRESH_WINDOW.min) * Math.random() }
    }
    return this.#jitter.share
  }

  #nextDelay(): number {
    const now = Date.now()
    const due = this.#dueAt() - now
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

  #store({ replaced, renewed }: { replaced: string; renewed: RenewedAgentToken }): void {
    const { warn, credentials } = this.#options
    const issuedAt = Date.now()
    const refreshed = {
      token: renewed.token,
      issuedAt: new Date(issuedAt).toISOString(),
      expiresAt: renewed.expiresIn === undefined ? undefined : new Date(issuedAt + renewed.expiresIn * 1000).toISOString(),
    }
    credentials.set({ ...credentials.get(), ...refreshed })
    if (this.#timer) this.#schedule(this.#nextDelay())
    // Not awaited: a keychain prompt can hold the write past the new token's expiry, and renewal must go on meanwhile.
    // Only the token changes on disk, so permissions saved since this run read the file are kept.
    this.#writes = this.#writes.then(() =>
      updateCredentials((stored) => (stored && [replaced, this.#onDisk].includes(stored.token) ? { ...stored, ...refreshed } : undefined)).then(
        (written) => {
          if (written) this.#onDisk = refreshed.token
        },
        (error: unknown) => warn(`Could not store the refreshed token: ${toError(error).message}`),
      ),
    )
  }

  // Resolves whether the token changed; a failure keeps the old one.
  async #refreshToken(force: boolean): Promise<boolean> {
    const { studioUrl, signal, warn, credentials } = this.#options
    if (!force && Date.now() < this.#dueAt()) return false
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
      this.#store({ replaced, renewed })
      return true
    } catch (error) {
      if (!signal.aborted && !(error instanceof InvalidAgentTokenError)) warn(`Could not refresh the agent token: ${toError(error).message}`)
      return false
    }
  }
}

/** Refreshes the token now when it is due, then each time it comes due until `stop`. */
export async function startTokenRefresher(options: TokenRefresherOptions): Promise<TokenRefresher> {
  const refresher = new TokenRefresher(options)
  await refresher.refresh()
  refresher.start()
  return refresher
}
