import net from 'node:net'
import path from 'node:path'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { spawnAsync } from '@kubb/utils'
import { agentDefaults } from '../constants.ts'
import { buildTelemetryEvent, sendTelemetry } from '../utils/telemetry.ts'

type AgentStartOptions = {
  port: string | undefined
  host: string
  configPath: string
  allowWrite: boolean
  allowAll: boolean
  version: string
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

    // CLI params take priority over process.env; process.env fills in what the CLI didn't specify;
    // agentDefaults are the last resort. Build env as: defaults ← process.env ← CLI.
    const PORT = port !== undefined ? port : (process.env.PORT ?? agentDefaults.port)
    const HOST = host !== agentDefaults.host ? host : (process.env.HOST ?? agentDefaults.host)
    const KUBB_AGENT_ROOT = process.env.KUBB_AGENT_ROOT ?? process.cwd()
    const KUBB_AGENT_CONFIG = configPath !== agentDefaults.configFile ? configPath : (process.env.KUBB_AGENT_CONFIG ?? agentDefaults.configFile)
    const KUBB_AGENT_ALLOW_WRITE = allowAll || allowWrite ? 'true' : (process.env.KUBB_AGENT_ALLOW_WRITE ?? 'false')
    const KUBB_AGENT_ALLOW_ALL = allowAll ? 'true' : (process.env.KUBB_AGENT_ALLOW_ALL ?? 'false')
    const KUBB_AGENT_TOKEN = process.env.KUBB_AGENT_TOKEN
    const KUBB_AGENT_RETRY_TIMEOUT = process.env.KUBB_AGENT_RETRY_TIMEOUT ?? agentDefaults.retryTimeout
    const KUBB_STUDIO_URL = process.env.KUBB_STUDIO_URL ?? agentDefaults.studioUrl

    const env = {
      ...process.env,
      PORT,
      HOST,
      KUBB_AGENT_ROOT,
      KUBB_AGENT_CONFIG,
      KUBB_AGENT_ALLOW_WRITE,
      KUBB_AGENT_ALLOW_ALL,
      KUBB_AGENT_TOKEN,
      KUBB_AGENT_RETRY_TIMEOUT,
      KUBB_STUDIO_URL,
    }

    clack.log.step(styleText('cyan', 'Starting agent server...'))
    clack.log.info(styleText('dim', `Config: ${KUBB_AGENT_CONFIG}`))
    clack.log.info(styleText('dim', `Host: ${HOST}`))
    clack.log.info(styleText('dim', `Port: ${PORT}`))
    if (!KUBB_AGENT_ALLOW_WRITE && !KUBB_AGENT_ALLOW_ALL) {
      clack.log.warn(styleText('yellow', 'Filesystem writes disabled. Use --allow-write or --allow-all to enable.'))
    }

    if (!(await isPortAvailable(Number(PORT), HOST))) {
      clack.log.error(styleText('red', `Port ${PORT} is already in use. Stop the existing process or choose a different port with --port.`))
      process.exit(1)
    }

    // Spawns the server as a detached background process so the CLI can exit independently.
    await spawnAsync('node', [serverPath], {
      env,
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
