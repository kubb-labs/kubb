import { hash } from 'node:crypto'
import { chmodSync, mkdirSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { exists, isPathInside, read, rm, writeRaw } from '@internals/utils'

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
 * Key-value files rooted at {@link resolveKubbDir}. Each key is a file path inside that folder.
 * Strings are stored as is and other values as JSON. `getItem` parses JSON and falls back to the
 * raw string. The 0700 folder keeps files such as a stored token private.
 *
 * @example
 * ```ts
 * const storage = kubbStorage({ base: 'cache' })
 * await storage.setItem('machine-secret', secret)
 * ```
 */
export function kubbStorage({ base }: KubbStorageOptions = {}) {
  const dir = resolveKubbDir(base)
  // Same keys as unstorage: `:` separates folders, and a key may not leave `dir`
  const pathOf = (key: string) => {
    const path = resolve(dir, key.replaceAll(':', '/'))
    if (path === dir || !isPathInside(path, dir)) throw new Error(`Invalid key: ${JSON.stringify(key)}. It should not leave the storage folder`)
    return path
  }

  return {
    async getItem<T = unknown>(key: string): Promise<T | null> {
      const path = pathOf(key)
      if (!(await exists(path))) return null
      const raw = await read(path)
      try {
        return JSON.parse(raw) as T
      } catch {
        return raw as T
      }
    },
    async setItem(key: string, value: unknown): Promise<void> {
      await writeRaw(pathOf(key), typeof value === 'string' ? value : JSON.stringify(value))
    },
    async removeItem(key: string): Promise<void> {
      await rm(pathOf(key), { force: true })
    },
  }
}
