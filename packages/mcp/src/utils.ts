import { existsSync } from 'node:fs'
import path from 'node:path'
import { CONFIG_EXTENSIONS, loadModule } from '@internals/shared'
import { isPathInside } from '@internals/utils'
import type { CLIOptions, PossibleConfig, SerializedDiagnostic } from '@kubb/core'

const CONFIG_FILE_NAMES = CONFIG_EXTENSIONS.map((extension) => `kubb.config${extension}`)

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

type NotifyFunction = (type: string, message: string, data?: Record<string, unknown>) => void

/**
 * Loads the user's Kubb config and returns it with the directory it was found in.
 *
 * When `configPath` is given it must use an allowed extension and resolve inside
 * the current working directory, otherwise loading throws. When omitted, the
 * known `kubb.config.*` file names are tried in the current directory. Every
 * outcome is reported through `notify` before the function returns or throws.
 */
export async function loadUserConfig(
  configPath: string | undefined,
  { notify }: { notify: NotifyFunction },
): Promise<{ userConfig: PossibleConfig<CLIOptions>; cwd: string }> {
  if (configPath) {
    const ext = path.extname(configPath)
    if (!CONFIG_EXTENSIONS.some((extension) => extension === ext)) {
      const msg = `Invalid config file extension "${ext}". Allowed: ${CONFIG_EXTENSIONS.join(', ')}`
      notify('CONFIG_ERROR', msg)
      throw new Error(msg)
    }
    const base = path.resolve(process.cwd())
    const resolvedConfigPath = path.resolve(base, configPath)
    if (!isPathInside(resolvedConfigPath, base)) {
      const msg = 'Invalid config file path: must be within the current working directory'
      notify('CONFIG_ERROR', msg)
      throw new Error(msg)
    }
    const cwd = path.dirname(resolvedConfigPath)
    try {
      const userConfig = await loadModule<PossibleConfig<CLIOptions>>(resolvedConfigPath, { default: true })
      notify('CONFIG_LOADED', `Loaded config from ${resolvedConfigPath}`)
      return { userConfig, cwd }
    } catch (error) {
      const msg = `Failed to load config: ${error instanceof Error ? error.message : String(error)}`
      notify('CONFIG_ERROR', msg)
      throw new Error(msg)
    }
  }

  const cwd = process.cwd()

  for (const configFileName of CONFIG_FILE_NAMES) {
    const configFilePath = path.resolve(process.cwd(), configFileName)
    if (!existsSync(configFilePath)) continue
    try {
      const userConfig = await loadModule<PossibleConfig<CLIOptions>>(configFilePath, { default: true })
      notify('CONFIG_LOADED', `Loaded ${configFileName} from current directory`)
      return { userConfig, cwd }
    } catch (err) {
      notify('CONFIG_ERROR', `Failed to load ${configFileName}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  notify('CONFIG_ERROR', 'No config file found')
  throw new Error(`No config file found. Please provide a config path or create one of: ${CONFIG_FILE_NAMES.join(', ')}`)
}
