import { hash } from 'node:crypto'
import { chmodSync, mkdirSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { createStorage as createUnstorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'

type KubbStorageOptions = {
  /**
   * Folder inside the Kubb home, or an absolute path such as `<cwd>/.kubb`.
   */
  base?: string
}

function ensurePrivateDir(dir: string): string {
  mkdirSync(dir, { recursive: true, mode: 0o700 })
  chmodSync(dir, 0o700)
  return dir
}

/**
 * Folder Kubb keeps its own files in, created with mode 0700. `base` resolves inside `KUBB_HOME`
 * (default `~/.kubb`). When that folder is not writable, it falls back to a folder in the OS temp directory.
 *
 * @example
 * `resolveKubbDir('cache') // '/home/me/.kubb/cache'`
 */
export function resolveKubbDir(base = ''): string {
  const dir = resolve(process.env.KUBB_HOME ?? join(homedir(), '.kubb'), base)
  try {
    return ensurePrivateDir(dir)
  } catch {
    return ensurePrivateDir(join(tmpdir(), 'kubb', hash('sha256', dir).slice(0, 16)))
  }
}

/**
 * unstorage on the fs driver, rooted at {@link resolveKubbDir}. The fs driver cannot set a file
 * mode, so the 0700 folder keeps files such as a stored token private.
 *
 * @example
 * ```ts
 * const storage = kubbStorage({ base: 'cache' })
 * await storage.setItem('machine-secret', secret)
 * ```
 */
export function kubbStorage({ base }: KubbStorageOptions = {}) {
  return createUnstorage({ driver: fsDriver({ base: resolveKubbDir(base) }) })
}
