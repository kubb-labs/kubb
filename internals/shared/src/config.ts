import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { CONFIG_EXTENSIONS } from './constants.ts'
import { loadModule } from './loader.ts'

const SEARCH_FILES = ['', '.config/', 'configs/'].flatMap((prefix) => [`${prefix}.kubbrc`, `${prefix}kubb.config`])

/** The first Kubb config file in `cwd` or the nearest parent: `.kubbrc` before `kubb.config`, the folder before `.config/` and `configs/`. */
export function findConfigFile(cwd: string = process.cwd()): string | undefined {
  for (let dir = resolve(cwd); ; dir = dirname(dir)) {
    const found = SEARCH_FILES.flatMap((file) => CONFIG_EXTENSIONS.map((extension) => join(dir, `${file}${extension}`))).find((file) => existsSync(file))
    if (found || dirname(dir) === dir) return found
  }
}

/** Loads a config module, calls it with `cli` when it exports a function, and always returns a list of configs. */
export async function loadConfigFile<T>(file: string, cli: unknown): Promise<Array<T>> {
  const loaded = await loadModule<unknown>(file, { default: true })
  const resolved = (await (typeof loaded === 'function' ? loaded(cli) : loaded)) as T | Array<T>
  return Array.isArray(resolved) ? resolved : [resolved]
}
