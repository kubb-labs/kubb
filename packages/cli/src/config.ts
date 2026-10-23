import { resolve } from 'node:path'
import process from 'node:process'
import { CONFIG_EXTENSIONS, findConfigFile, loadConfigFile } from '@internals/shared'
import { type CLIOptions, type Config, Diagnostics } from '@kubb/core'
import { toError } from '@internals/utils'

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
    throw new Diagnostics.Error({
      code: Diagnostics.code.unknown,
      severity: 'error',
      message: `No Kubb config found. Looked for kubb.config.* and .kubbrc.* (${CONFIG_EXTENSIONS.join(', ')}) in ${process.cwd()}, its .config/ and configs/ folders, and each parent folder.`,
      help: 'Run `kubb init` to create one, or pass a path with `--config`.',
      location: { kind: 'config' },
    })
  }

  let configs: Array<Config>
  try {
    configs = await loadConfigFile<Config>({ file, cli: { config: configPath, input, watch, logLevel } satisfies CLIOptions })
  } catch (error) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.unknown,
      severity: 'error',
      message: `Config failed loading: ${file}`,
      help: 'Fix the error the config file throws, shown under `caused by:`.',
      location: { kind: 'config' },
      cause: toError(error),
    })
  }

  return { configPath: file, configs: configs.map((item) => ({ ...item, plugins: item.plugins ?? [] })) }
}
