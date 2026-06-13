import { existsSync } from 'node:fs'
import path from 'node:path'
import { createModuleLoader } from '@internals/shared'
import { isPromise } from '@internals/utils'
import type { CLIOptions, Config, PossibleConfig, SerializedDiagnostic } from '@kubb/core'
import { ALLOWED_CONFIG_EXTENSIONS, NotifyTypes } from './constants.ts'

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
  const { code, severity, message, location, help, plugin, docsUrl } = diagnostic
  const rule = plugin ? `${plugin}(${code})` : code
  const lines = [`${severity} ${rule}: ${message}`]

  if (location && 'pointer' in location) {
    lines.push(`  at ${location.pointer}`)
  }
  if (help) {
    lines.push(`  help: ${help}`)
  }
  if (docsUrl) {
    lines.push(`  docs: ${docsUrl}`)
  }

  return lines.join('\n')
}

type NotifyFunction = (type: string, message: string, data?: Record<string, unknown>) => Promise<void>

const loader = createModuleLoader()

const loadedModules = new Map<string, unknown>()

async function loadModule(filePath: string): Promise<unknown> {
  const ext = path.extname(filePath)
  if (!ALLOWED_CONFIG_EXTENSIONS.has(ext)) {
    throw new Error(`Invalid config file extension "${ext}". Allowed: ${[...ALLOWED_CONFIG_EXTENSIONS].join(', ')}`)
  }
  if (loadedModules.has(filePath)) {
    return loadedModules.get(filePath)
  }
  const mod = await loader.load(filePath, { default: true })
  loadedModules.set(filePath, mod)
  return mod
}

export async function loadUserConfig(configPath: string | undefined, { notify }: { notify: NotifyFunction }): Promise<{ userConfig: Config; cwd: string }> {
  if (configPath) {
    const ext = path.extname(configPath)
    if (!ALLOWED_CONFIG_EXTENSIONS.has(ext)) {
      const msg = `Invalid config file extension "${ext}". Allowed: ${[...ALLOWED_CONFIG_EXTENSIONS].join(', ')}`
      await notify(NotifyTypes.CONFIG_ERROR, msg)
      throw new Error(msg)
    }
    const base = path.resolve(process.cwd())
    const resolvedConfigPath = path.resolve(base, configPath)
    const relative = path.relative(base, resolvedConfigPath)
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      const msg = 'Invalid config file path: must be within the current working directory'
      await notify(NotifyTypes.CONFIG_ERROR, msg)
      throw new Error(msg)
    }
    const cwd = path.dirname(resolvedConfigPath)
    try {
      const userConfig = (await loadModule(resolvedConfigPath)) as Config
      await notify(NotifyTypes.CONFIG_LOADED, `Loaded config from ${resolvedConfigPath}`)
      return { userConfig, cwd }
    } catch (error) {
      const msg = `Failed to load config: ${error instanceof Error ? error.message : String(error)}`
      await notify(NotifyTypes.CONFIG_ERROR, msg)
      throw new Error(msg)
    }
  }

  const cwd = process.cwd()
  const configFileNames = ['kubb.config.ts', 'kubb.config.mts', 'kubb.config.cts', 'kubb.config.js', 'kubb.config.cjs']

  for (const configFileName of configFileNames) {
    const configFilePath = path.resolve(process.cwd(), configFileName)
    if (!existsSync(configFilePath)) continue
    try {
      const userConfig = (await loadModule(configFilePath)) as Config
      await notify(NotifyTypes.CONFIG_LOADED, `Loaded ${configFileName} from current directory`)
      return { userConfig, cwd }
    } catch (err) {
      await notify(NotifyTypes.CONFIG_ERROR, `Failed to load ${configFileName}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  await notify(NotifyTypes.CONFIG_ERROR, 'No config file found')
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

export type ResolveUserConfigOptions = {
  configPath?: string
  logLevel?: string
}

export async function resolveUserConfig(config: PossibleConfig<CLIOptions>, options: ResolveUserConfigOptions): Promise<Config> {
  const result = typeof config === 'function' ? config({ logLevel: options.logLevel as CLIOptions['logLevel'], config: options.configPath }) : config
  const resolved = isPromise(result) ? await result : result
  return (Array.isArray(resolved) ? resolved[0] : resolved) as Config
}
