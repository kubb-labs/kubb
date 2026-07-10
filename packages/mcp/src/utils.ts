import { existsSync } from 'node:fs'
import path from 'node:path'
import { createModuleLoader } from '@internals/shared'
import { isPromise } from '@internals/utils'
import type { CLIOptions, Config, PossibleConfig, SerializedDiagnostic } from '@kubb/core'
import { ALLOWED_CONFIG_EXTENSIONS } from './constants.ts'

/**
 * Renders serialized diagnostics as a plain-text block for an AI assistant. Each entry
 * keeps the stable `code`, the source pointer, the suggested fix, and the docs link, so
 * the agent can act on the problem rather than parsing a bare message. No ANSI styling,
 * unlike the CLI renderer.
 */
export function formatDiagnostics(diagnostics: ReadonlyArray<SerializedDiagnostic>): string {
  return diagnostics.map((diagnostic) => formatDiagnostic(diagnostic)).join('\n\n')
}

function formatDiagnostic(diagnostic: SerializedDiagnostic): string {
  const { code, message, location, help, plugin, docsUrl } = diagnostic
  const lines = [plugin ? `[${code}] ${plugin}: ${message}` : `[${code}]: ${message}`]

  if (location && 'pointer' in location) {
    lines.push(`  at: ${location.pointer}`)
  }
  if (help) {
    lines.push(`  fix: ${help}`)
  }
  if (docsUrl) {
    lines.push(`  see: ${docsUrl}`)
  }

  return lines.join('\n')
}

type NotifyFunction = (type: string, message: string, data?: Record<string, unknown>) => Promise<void>

const loader = createModuleLoader()

const loadedModules = new Map<string, unknown>()

async function loadModule(filePath: string): Promise<unknown> {
  if (loadedModules.has(filePath)) {
    return loadedModules.get(filePath)
  }
  const mod = await loader.load(filePath, { default: true })
  loadedModules.set(filePath, mod)
  return mod
}

/**
 * Loads the user's Kubb config and returns it with the directory it was found in.
 *
 * When `configPath` is given it must use an allowed extension and resolve inside
 * the current working directory, otherwise loading throws. When omitted, the
 * known `kubb.config.*` file names are tried in the current directory. Every
 * outcome is reported through `notify` before the function returns or throws.
 */
export async function loadUserConfig(configPath: string | undefined, { notify }: { notify: NotifyFunction }): Promise<{ userConfig: Config; cwd: string }> {
  if (configPath) {
    const ext = path.extname(configPath)
    if (!ALLOWED_CONFIG_EXTENSIONS.has(ext)) {
      const msg = `Invalid config file extension "${ext}". Allowed: ${[...ALLOWED_CONFIG_EXTENSIONS].join(', ')}`
      await notify('CONFIG_ERROR', msg)
      throw new Error(msg)
    }
    const base = path.resolve(process.cwd())
    const resolvedConfigPath = path.resolve(base, configPath)
    const relative = path.relative(base, resolvedConfigPath)
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      const msg = 'Invalid config file path: must be within the current working directory'
      await notify('CONFIG_ERROR', msg)
      throw new Error(msg)
    }
    const cwd = path.dirname(resolvedConfigPath)
    try {
      const userConfig = (await loadModule(resolvedConfigPath)) as Config
      await notify('CONFIG_LOADED', `Loaded config from ${resolvedConfigPath}`)
      return { userConfig, cwd }
    } catch (error) {
      const msg = `Failed to load config: ${error instanceof Error ? error.message : String(error)}`
      await notify('CONFIG_ERROR', msg)
      throw new Error(msg)
    }
  }

  const cwd = process.cwd()
  const configFileNames = ['kubb.config.ts', 'kubb.config.mts', 'kubb.config.cts', 'kubb.config.js', 'kubb.config.mjs', 'kubb.config.cjs']

  for (const configFileName of configFileNames) {
    const configFilePath = path.resolve(process.cwd(), configFileName)
    if (!existsSync(configFilePath)) continue
    try {
      const userConfig = (await loadModule(configFilePath)) as Config
      await notify('CONFIG_LOADED', `Loaded ${configFileName} from current directory`)
      return { userConfig, cwd }
    } catch (err) {
      await notify('CONFIG_ERROR', `Failed to load ${configFileName}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  await notify('CONFIG_ERROR', 'No config file found')
  throw new Error(`No config file found. Please provide a config path or create one of: ${configFileNames.join(', ')}`)
}

/**
 * Determine the root directory based on userConfig.root and resolvedConfigDir
 * 1. If userConfig.root exists and is absolute, use it as-is
 * 2. If userConfig.root exists and is relative, resolve it relative to config directory
 * 3. Otherwise, use the config directory as root
 */
export function resolveCwd(userConfig: Config, cwd: string): string {
  if (userConfig.root) {
    if (path.isAbsolute(userConfig.root)) {
      return userConfig.root
    }

    return path.resolve(cwd, userConfig.root)
  }

  return cwd
}

/**
 * Inputs forwarded to a config when it is defined as a function.
 */
export type ResolveUserConfigOptions = {
  /**
   * Path of the loaded config, passed through to the config function as `config`.
   */
  configPath?: string
  /**
   * Log level passed through to the config function.
   */
  logLevel?: CLIOptions['logLevel']
}

/**
 * Normalizes a possible config into a single resolved `Config`.
 *
 * Calls the config when it is a function, awaits it when it is a promise, and
 * picks the first entry when it resolves to an array.
 */
export async function resolveUserConfig(config: PossibleConfig<CLIOptions>, options: ResolveUserConfigOptions): Promise<Config> {
  const result = typeof config === 'function' ? config({ logLevel: options.logLevel, config: options.configPath }) : config
  const resolved = isPromise(result) ? await result : result

  return (Array.isArray(resolved) ? resolved[0] : resolved) as Config
}
