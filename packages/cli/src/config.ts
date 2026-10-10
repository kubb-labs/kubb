import { basename, dirname, resolve } from 'node:path'
import process from 'node:process'
import { createModuleLoader } from '@internals/shared'
import type { CLIOptions, Config, PossibleConfig } from '@kubb/core'
import { type LoadConfigResult, type LoadConfigSource, loadConfig } from 'unconfig'

const loader = createModuleLoader()

// Kubb configs are JS/TS modules (they call `defineConfig`/`pluginX()`), so YAML and JSON are not
// supported. The jiti loader handles every module format and the JSX runtime, returning the default export.
const tsLoader = (configFile: string) => loader.load(configFile, { default: true })

const MODULE_NAME = 'kubb'

const SEARCH_FILES = ['', '.config/', 'configs/'].flatMap((prefix) => [`${prefix}.${MODULE_NAME}rc`, `${prefix}${MODULE_NAME}.config`])
const SEARCH_EXTENSIONS = ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs']

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
  const sources: Array<LoadConfigSource<unknown>> = abs
    ? [{ files: [basename(abs)], extensions: [], parser: tsLoader }]
    : [{ files: SEARCH_FILES, extensions: SEARCH_EXTENSIONS, parser: tsLoader }]

  let result: LoadConfigResult<unknown>
  try {
    result = await loadConfig<unknown>({ cwd: abs ? dirname(abs) : cwd, sources, merge: false })
  } catch (error) {
    throw new Error('Config failed loading', { cause: error })
  }

  const [filepath] = result.sources
  if (!result.config || !filepath) {
    throw new Error('Config not defined, create a kubb.config.js or pass through your config with the option --config')
  }

  const config = result.config as PossibleConfig<CLIOptions>
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
