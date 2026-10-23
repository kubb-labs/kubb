import { existsSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { CONFIG_EXTENSIONS } from './constants.ts'
import { loadModule } from './loader.ts'

// A config in one of these folders belongs to the folder above it.
const CONFIG_FOLDERS = ['.config', 'configs']
const SEARCH_FILES = ['', ...CONFIG_FOLDERS.map((folder) => `${folder}/`)].flatMap((prefix) => [`${prefix}.kubbrc`, `${prefix}kubb.config`])

/**
 * Every config file path the Kubb CLI checks in `dir`, in the order it checks them.
 */
export function configFileCandidates(dir: string): Array<string> {
  return SEARCH_FILES.flatMap((file) => CONFIG_EXTENSIONS.map((extension) => join(dir, `${file}${extension}`)))
}

/**
 * The first Kubb config file in `cwd` or the nearest parent folder that has one: `.kubbrc` before
 * `kubb.config`, the folder itself before its `.config/` and `configs/`, and {@link CONFIG_EXTENSIONS} in order.
 */
export function findConfigFile(cwd: string = process.cwd()): string | undefined {
  for (let dir = resolve(cwd); ; dir = dirname(dir)) {
    const found = configFileCandidates(dir).find((file) => existsSync(file))
    if (found || dirname(dir) === dir) return found
  }
}

/**
 * Loads a Kubb config module, calls it with `cli` when it exports a function, and returns its
 * configs as a list, so a single config and a `defineConfig([...])` array read the same. Each
 * `root` resolves from the folder the config belongs to: the file's folder, or the folder above
 * `.config/` and `configs/`. A missing `root` becomes that folder, so the CLI, the bundler, and
 * an editor read the same paths wherever they run.
 */
export async function loadConfigFile<T extends { root?: string }>({ file, cli }: { file: string; cli: unknown }): Promise<Array<T>> {
  const loaded = await loadModule<unknown>(file, { default: true })
  const resolved = (await (typeof loaded === 'function' ? loaded(cli) : loaded)) as T | Array<T>
  const dir = CONFIG_FOLDERS.includes(basename(dirname(file))) ? dirname(dirname(file)) : dirname(file)
  return (Array.isArray(resolved) ? resolved : [resolved]).map((config) => ({ ...config, root: resolve(dir, config.root ?? '.') }))
}
