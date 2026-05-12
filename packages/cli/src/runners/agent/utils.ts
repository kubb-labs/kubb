import net from 'node:net'
import path from 'node:path'
import process from 'node:process'
import { agentDefaults } from '../../constants.ts'

type AgentStartEnvironmentInput = {
  /**
   * TCP port for the HTTP server. When `undefined`, falls back to `PORT` env var or the default (`3000`).
   */
  port: string | undefined
  /**
   * Hostname the HTTP server binds to.
   */
  host: string
  /**
   * Explicit path to the Kubb config file. When `undefined`, falls back to `KUBB_AGENT_CONFIG` or the default filename.
   */
  configPath: string | undefined
  /**
   * Grants the agent permission to write generated files to the filesystem.
   */
  allowWrite: boolean
  /**
   * Grants all agent permissions, including filesystem writes. Implies `allowWrite`.
   */
  allowAll: boolean
}

type ResolvedAgentStartEnvironment = {
  /**
   * Final port string after merging CLI flag, `PORT` env var, and the default.
   */
  port: string
  /**
   * Final hostname after merging CLI flag, `HOST` env var, and the default.
   */
  host: string
  /**
   * Effective write-permission flag, accounting for `allowAll` and `KUBB_AGENT_ALLOW_WRITE`.
   */
  allowWrite: boolean
  /**
   * Effective all-permissions flag, accounting for `KUBB_AGENT_ALLOW_ALL`.
   */
  allowAll: boolean
  /**
   * Absolute path to the Kubb config file passed to the agent subprocess.
   */
  agentConfigPath: string
  /**
   * Merged `process.env` object with all resolved agent environment variables applied.
   */
  env: NodeJS.ProcessEnv
}

/**
 * Resolves the environment passed to the detached agent process using CLI values first, then environment values, then CLI defaults.
 */
export function resolveAgentStartEnvironment({ port, host, configPath, allowWrite, allowAll }: AgentStartEnvironmentInput): ResolvedAgentStartEnvironment {
  const resolvedPort = port ?? process.env.PORT ?? agentDefaults.port
  const resolvedHost = host !== agentDefaults.host ? host : (process.env.HOST ?? agentDefaults.host)
  const resolvedAllowAll = allowAll || process.env.KUBB_AGENT_ALLOW_ALL === 'true'
  const resolvedAllowWrite = resolvedAllowAll || allowWrite || process.env.KUBB_AGENT_ALLOW_WRITE === 'true'
  const agentRoot = process.env.KUBB_AGENT_ROOT ?? process.cwd()
  const agentConfigPath = path.resolve(process.cwd(), configPath || process.env.KUBB_AGENT_CONFIG || agentDefaults.configFile)

  return {
    port: resolvedPort,
    host: resolvedHost,
    allowWrite: resolvedAllowWrite,
    allowAll: resolvedAllowAll,
    agentConfigPath,
    env: {
      ...process.env,
      PORT: resolvedPort,
      HOST: resolvedHost,
      KUBB_AGENT_ROOT: agentRoot,
      KUBB_AGENT_CONFIG: agentConfigPath,
      KUBB_AGENT_ALLOW_WRITE: String(resolvedAllowWrite),
      KUBB_AGENT_ALLOW_ALL: String(resolvedAllowAll),
      KUBB_AGENT_TOKEN: process.env.KUBB_AGENT_TOKEN,
      KUBB_AGENT_RETRY_TIMEOUT: process.env.KUBB_AGENT_RETRY_TIMEOUT ?? agentDefaults.retryTimeout,
      KUBB_STUDIO_URL: process.env.KUBB_STUDIO_URL ?? agentDefaults.studioUrl,
    },
  }
}

export function isPortAvailable(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close()
      resolve(true)
    })
    server.listen(port, host)
  })
}
