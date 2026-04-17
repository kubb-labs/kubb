import net from 'node:net'
import path from 'node:path'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { spawnAsync } from '@internals/utils'
import { agentDefaults } from '../constants.ts'
import { buildTelemetryEvent, sendTelemetry } from '../utils/telemetry.ts'

type AgentStartOptions = {
  port: string | undefined
  host: string
  configPath: string | undefined
  allowWrite: boolean
  allowAll: boolean
  version: string
}

type ResolvedAgentStartEnvironment = {
  port: string
  host: string
  allowWrite: boolean
  allowAll: boolean
  agentConfigPath: string
  env: NodeJS.ProcessEnv
}

/**
 * Resolves the environment passed to the detached agent process using CLI values first, then environment values, then CLI defaults.
 */
function resolveAgentStartEnvironment({ port, host, configPath, allowWrite, allowAll }: Omit<AgentStartOptions, 'version'>): ResolvedAgentStartEnvironment {
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

function isPortAvailable(port: number, host: string): Promise<boolean> {
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

export async function runAgentStart({ port, host, configPath, allowWrite, allowAll, version }: AgentStartOptions): Promise<void> {
  const hrStart = process.hrtime()

  try {
    // Load .env file into process.env using Node.js built-in (v20.12.0+)
    try {
      process.loadEnvFile()
    } catch {
      // .env file may not exist; ignore
    }

    // Resolve the @kubb/agent package path
    const agentPkgUrl = import.meta.resolve('@kubb/agent/package.json')
    const agentPkgPath = fileURLToPath(agentPkgUrl)
    const agentDir = path.dirname(agentPkgPath)
    const serverPath = path.join(agentDir, agentDefaults.serverEntryPath)

    const resolvedEnv = resolveAgentStartEnvironment({ port, host, configPath, allowWrite, allowAll })
    const numericPort = Number(resolvedEnv.port)

    if (!Number.isInteger(numericPort) || numericPort <= 0) {
      throw new Error(`Invalid port "${resolvedEnv.port}". Provide a positive integer with --port or PORT.`)
    }

    clack.log.step(styleText('cyan', 'Starting agent server...'))
    clack.log.info(styleText('dim', `Config: ${resolvedEnv.agentConfigPath}`))
    clack.log.info(styleText('dim', `Host: ${resolvedEnv.host}`))
    clack.log.info(styleText('dim', `Port: ${resolvedEnv.port}`))
    if (!resolvedEnv.allowWrite && !resolvedEnv.allowAll) {
      clack.log.warn(styleText('yellow', 'Filesystem writes disabled. Use --allow-write or --allow-all to enable.'))
    }

    if (!(await isPortAvailable(numericPort, resolvedEnv.host))) {
      clack.log.error(styleText('red', `Port ${resolvedEnv.port} is already in use. Stop the existing process or choose a different port with --port.`))
      process.exit(1)
    }

    // Spawns the server as a detached background process so the CLI can exit independently.
    await spawnAsync('node', [serverPath], {
      env: resolvedEnv.env,
      cwd: process.cwd(),
    })

    await sendTelemetry(buildTelemetryEvent({ command: 'agent', kubbVersion: version, hrStart, status: 'success' }))
  } catch (error) {
    await sendTelemetry(buildTelemetryEvent({ command: 'agent', kubbVersion: version, hrStart, status: 'failed' }))
    clack.log.error(styleText('red', 'Failed to start agent server'))
    console.error(error)
    process.exit(1)
  }
}
