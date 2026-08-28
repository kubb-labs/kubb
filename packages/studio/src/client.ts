import { getErrorMessage } from '@internals/utils'
import { version as kubbVersion } from '@kubb/core/package.json'
import type { Storage } from 'unstorage'
import { agentDefaults } from './constants.ts'
import { registerAgent } from './api.ts'
import { type ConnectToStudioOptions, connectToStudio } from './connectStudio.ts'
import { logger, setLogLevel } from './logger.ts'
import { setStorage } from './machine.ts'

export type ClientOptions = Omit<ConnectToStudioOptions, 'signal'> & {
  /**
   * Where the machine secret and the last Studio config are persisted. Defaults to in-memory,
   * which gives up a stable machine identity across restarts.
   */
  storage?: Storage
  /**
   * How much the client prints. `silent` keeps errors only, `verbose` adds the per-message protocol
   * chatter. A level, not a logger: a host chooses how loud, not where the output goes.
   */
  logLevel?: 'silent' | 'info' | 'verbose'
}

export type Client = {
  /**
   * Registers with Studio and opens the session pool. Resolves once the pool is starting: the
   * sessions keep running, and reconnect on their own, until `disconnect` is called.
   */
  connect: () => Promise<void>
  /**
   * Closes every session and stops reconnecting.
   */
  disconnect: () => void
}

/**
 * Creates the Kubb Studio client: the connection, the command loop, and the generation event
 * stream shared by the `kubb studio` CLI command and the Docker agent.
 *
 * Every permission is off by default. A host that wants more grants it explicitly.
 *
 * @example
 * ```ts
 * const studio = createClient({ token, configPath, version, loadConfig: () => loadMyConfig() })
 * await studio.connect()
 * ```
 */
export function createClient({ storage, logLevel, ...options }: ClientOptions): Client {
  setLogLevel(logLevel)

  if (storage) {
    setStorage(storage)
  }

  const controller = new AbortController()
  const poolSize = options.poolSize ?? agentDefaults.poolSize

  return {
    async connect() {
      logger.info(`Kubb Studio client v${options.version} (kubb v${kubbVersion})`)

      await registerAgent({ token: options.token, studioUrl: options.studioUrl ?? agentDefaults.studioUrl, poolSize })

      // Each slot is its own session, so one Studio user never sees another's generation events.
      // Not awaited: a slot retrying against a down Studio must not block the others, or the host's
      // startup. `connectToStudio` owns the retry loop for the lifetime of the slot.
      for (const slot of Array.from({ length: poolSize }, (_, index) => index + 1)) {
        void connectToStudio({ ...options, signal: controller.signal }).catch((error: unknown) => {
          logger.warn(`Session ${slot}/${poolSize} failed to connect`, getErrorMessage(error))
        })
      }
    },
    disconnect() {
      controller.abort()
    },
  }
}
