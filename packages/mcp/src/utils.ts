import { existsSync } from 'node:fs'
import path from 'node:path'
import { createModuleLoader } from '@internals/shared'
import { isPathInside, isPromise } from '@internals/utils'
import type { CLIOptions, Config, PossibleConfig, SerializedDiagnostic } from '@kubb/core'

/**
 * File extensions a Kubb config may use. Any other extension is rejected before the file loads.
 */
const ALLOWED_CONFIG_EXTENSIONS = ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs']
const CONFIG_FILE_NAMES = ALLOWED_CONFIG_EXTENSIONS.map((extension) => `kubb.config${extension}`)

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

// No cache: the MCP server is long-running, so every tool call re-reads the config to pick up edits.
function loadModule(filePath: string): Promise<unknown> {
  return loader.load(filePath, { default: true })
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
    if (!ALLOWED_CONFIG_EXTENSIONS.includes(ext)) {
      const msg = `Invalid config file extension "${ext}". Allowed: ${ALLOWED_CONFIG_EXTENSIONS.join(', ')}`
      await notify('CONFIG_ERROR', msg)
      throw new Error(msg)
    }
    const base = path.resolve(process.cwd())
    const resolvedConfigPath = path.resolve(base, configPath)
    if (!isPathInside(resolvedConfigPath, base)) {
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

  for (const configFileName of CONFIG_FILE_NAMES) {
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
  throw new Error(`No config file found. Please provide a config path or create one of: ${CONFIG_FILE_NAMES.join(', ')}`)
}

/**
 * Inputs forwarded to a config when it is defined as a function.
 */
type ResolveUserConfigOptions = {
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
