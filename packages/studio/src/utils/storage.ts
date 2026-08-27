import { createStorage, type Storage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'

/**
 * Key-value storage the runtime uses for its machine secret and the last Studio config.
 *
 * One storage per process, since one process serves one config file. Hosts install their own
 * driver on startup: Nitro passes its `kubb` mount, the CLI an fs driver under `~/.kubb/cache`.
 * The in-memory default keeps the runtime usable without a host, at the cost of a machine
 * identity that changes on every restart.
 */
let storage: Storage = createStorage()

/**
 * Installs the storage driver the runtime persists to. Call once, before connecting.
 */
export function setStorage(next: Storage): void {
  storage = next
}

export function getStorage(): Storage {
  return storage
}

/**
 * A storage backed by files under `base`, so the machine secret and the last Studio config
 * survive a restart. Repeated pairings of one machine depend on that secret staying put.
 */
export function createFileStorage(base: string): Storage {
  return createStorage({ driver: fsDriver({ base }) })
}
