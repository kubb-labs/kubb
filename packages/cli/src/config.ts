import { stat } from 'node:fs/promises'
import { basename, dirname, parse, resolve } from 'node:path'
import process from 'node:process'
import { createModuleLoader } from '@internals/shared'
import type { CLIOptions, Config, PossibleConfig } from '@kubb/core'

const loader = createModuleLoader()

const MODULE_NAME = 'kubb'

const SEARCH_FILES = ['', '.config/', 'configs/'].flatMap((prefix) => [`${prefix}.${MODULE_NAME}rc`, `${prefix}${MODULE_NAME}.config`])
const SEARCH_EXTENSIONS = ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs']

/**
 * Every file name the search tries in one directory, in order: `.kubbrc` before `kubb.config`,
 * the top level before `.config/` and `configs/`, and `ts` first among the extensions.
 */
const SEARCH_CANDIDATES = SEARCH_FILES.flatMap((file) => SEARCH_EXTENSIONS.map((extension) => `${file}.${extension}`))

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile()
  } catch {
    return false
  }
}

type FindConfigFileOptions = {
  /**
   * Directory the search starts from.
   */
  cwd: string
  /**
   * File names, relative to each directory, tried in order.
   */
  files: ReadonlyArray<string>
}

/**
 * Walks up from `cwd` and returns the first of `files` that exists in a directory, trying every
 * name in one directory before moving to its parent. The filesystem root itself is not searched.
 */
export async function findConfigFile({ cwd, files }: FindConfigFileOptions): Promise<string | undefined> {
  const stopAt = parse(cwd).root

  for (let directory = cwd; directory !== stopAt; directory = dirname(directory)) {
    for (const file of files) {
      const path = resolve(directory, file)
      if (await isFile(path)) {
        return path
      }
    }
    if (dirname(directory) === directory) {
      return undefined
    }
  }

  return undefined
}

type GetConfigsOptions = {
  /**
   * Explicit path to the Kubb config file. When omitted, the loader searches up from `cwd`.
   */
  configPath?: string
  /**
   * Directory the search starts from.
   *
   * @default process.cwd()
   */
  cwd?: string
  /**
   * Optional OpenAPI input path or URL that overrides `config.input` for this run.
   */
  input?: string
  /**
   * Watch flag forwarded to the user's `defineConfig` function.
   */
  watch?: boolean
  /**
   * Log level forwarded to the user's `defineConfig` function.
   */
  logLevel?: CLIOptions['logLevel']
}

type GetConfigsResult = {
  /**
   * Absolute path to the resolved config file.
   */
  configPath: string
  /**
   * Resolved and normalized array of Kubb configs, each guaranteed to have a `plugins` array.
   */
  configs: Array<Config>
}

/**
 * Discovers the Kubb config and resolves it into a normalized array of configs.
 * Every config in the result is guaranteed to have a `plugins` array.
 */
export async function getConfigs({ configPath, cwd = process.cwd(), input, watch, logLevel }: GetConfigsOptions): Promise<GetConfigsResult> {
  const abs = configPath ? resolve(cwd, configPath) : undefined
  // An explicit path is searched the same way, by its name from its own directory up.
  const filepath = await (abs ? findConfigFile({ cwd: dirname(abs), files: [basename(abs)] }) : findConfigFile({ cwd, files: SEARCH_CANDIDATES }))

  // Kubb configs are JS/TS modules (they call `defineConfig`/`pluginX()`), so YAML and JSON are not
  // supported. The jiti loader handles every module format and the JSX runtime, returning the default export.
  let loaded: unknown
  try {
    loaded = filepath ? await loader.load(filepath, { default: true }) : undefined
  } catch (error) {
    throw new Error('Config failed loading', { cause: error })
  }

  if (!loaded || !filepath) {
    throw new Error('Config not defined, create a kubb.config.js or pass through your config with the option --config')
  }

  const config = loaded as PossibleConfig<CLIOptions>
  const cli: CLIOptions = { config: configPath, input, watch, logLevel }
  const resolved = await (typeof config === 'function' ? config(cli) : config)
  const userConfigs = Array.isArray(resolved) ? resolved : [resolved]

  return {
    configPath: filepath,
    configs: userConfigs.map((item) => {
      const config: Config = { ...item, plugins: item.plugins ?? [] }
      return config
    }),
  }
}
