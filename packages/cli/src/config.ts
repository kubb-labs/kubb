import { resolve } from 'node:path'
import process from 'node:process'
import { CONFIG_EXTENSIONS, findConfigFile, loadConfigFile } from '@internals/shared'
import type { CLIOptions, Config } from '@kubb/core'

type GetConfigsOptions = {
  /** Explicit path to the Kubb config file. When omitted, the loader searches up from `process.cwd()`. */
  configPath?: string
  /** OpenAPI input path or URL that overrides `config.input` for this run. */
  input?: string
  /** Watch flag forwarded to the user's `defineConfig` function. */
  watch?: boolean
  /** Log level forwarded to the user's `defineConfig` function. */
  logLevel?: CLIOptions['logLevel']
}

type GetConfigsResult = {
  /** Absolute path to the resolved config file. */
  configPath: string
  /** Resolved and normalized Kubb configs, each guaranteed to have a `plugins` array. */
  configs: Array<Config>
}

/** Discovers the Kubb config and resolves it into normalized configs, each guaranteed to have a `plugins` array. */
export async function getConfigs({ configPath, input, watch, logLevel }: GetConfigsOptions): Promise<GetConfigsResult> {
  const file = configPath ? resolve(configPath) : findConfigFile()
  if (!file) {
    throw new Error(
      `No Kubb config found. Looked for kubb.config.* and .kubbrc.* (${CONFIG_EXTENSIONS.join(', ')}) in ${process.cwd()}, its .config/ and configs/ folders, and each parent folder. Run \`kubb init\` to create one, or pass a path with --config.`,
    )
  }

  let configs: Array<Config>
  try {
    configs = await loadConfigFile<Config>(file, { config: configPath, input, watch, logLevel } satisfies CLIOptions)
  } catch (error) {
    throw new Error(`Config failed loading: ${file}`, { cause: error })
  }

  return { configPath: file, configs: configs.map((item) => ({ ...item, plugins: item.plugins ?? [] })) }
}
