import { spawn } from 'node:child_process'
import path from 'node:path'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { agentDefaults } from '../constants.ts'
import { buildTelemetryEvent, sendTelemetry } from '../utils/telemetry.ts'

type AgentStartOptions = {
  port: number
  host: string
  configPath: string
  allowWrite: boolean
  allowAll: boolean
  version: string
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

    // nitro env
    const PORT = process.env.PORT || (port === 0 ? agentDefaults.port : String(port))
    const HOST = process.env.HOST || host || '0.0.0.0'

    // kubb env
    const KUBB_AGENT_ROOT = process.env.KUBB_AGENT_ROOT || process.cwd()
    const KUBB_AGENT_CONFIG = process.env.KUBB_AGENT_CONFIG || configPath || agentDefaults.configFile
    const KUBB_AGENT_ALLOW_WRITE = allowAll || allowWrite ? 'true' : (process.env.KUBB_AGENT_ALLOW_WRITE ?? 'false')
    const KUBB_AGENT_ALLOW_ALL = allowAll ? 'true' : (process.env.KUBB_AGENT_ALLOW_ALL ?? 'false')
    const KUBB_AGENT_TOKEN = process.env.KUBB_AGENT_TOKEN
    const KUBB_AGENT_RETRY_TIMEOUT = process.env.KUBB_AGENT_RETRY_TIMEOUT || agentDefaults.retryTimeout
    const KUBB_STUDIO_URL = process.env.KUBB_STUDIO_URL || agentDefaults.studioUrl

    const env = {
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

    spawn('node', [serverPath], {
      env: { ...process.env, ...env },
      stdio: 'inherit',
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
