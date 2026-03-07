import { spawn } from 'node:child_process'
import path from 'node:path'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import type { ArgsDef } from 'citty'
import { defineCommand } from 'citty'
import { version } from '../../../package.json'
import { buildTelemetryEvent, sendTelemetry } from '../../utils/telemetry.ts'

const DEFAULT_PORT = '3000'
const DEFAULT_HOST = 'localhost'
const DEFAULT_CONFIG_FILE = 'kubb.config.ts'
const DEFAULT_RETRY_TIMEOUT = '30000'
const DEFAULT_STUDIO_URL = 'https://studio.kubb.dev'
const SERVER_ENTRY_PATH = path.join('.output', 'server', 'index.mjs')

const args = {
  config: {
    type: 'string',
    description: 'Path to the Kubb config',
    alias: 'c',
  },
  port: {
    type: 'string',
    description: `Port for the server (default: ${DEFAULT_PORT})`,
    alias: 'p',
  },
  host: {
    type: 'string',
    description: 'Host for the server',
    default: DEFAULT_HOST,
  },
  'no-cache': {
    type: 'boolean',
    description: 'Disable session caching',
    default: false,
  },
  'allow-write': {
    type: 'boolean',
    description: 'Allow writing generated files to the filesystem. When not set, no files are written and the config patch is not persisted.',
    default: false,
  },
  'allow-all': {
    type: 'boolean',
    description: 'Grant all permissions (implies --allow-write).',
    default: false,
  },
} as const satisfies ArgsDef

type StartServerProps = {
  port: number
  host: string
  configPath: string
  allowWrite: boolean
  allowAll: boolean
}

async function startServer({ port, host, configPath, allowWrite, allowAll }: StartServerProps): Promise<void> {
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
  const serverPath = path.join(agentDir, SERVER_ENTRY_PATH)

  // nitro env
  const PORT = process.env.PORT || (port === 0 ? DEFAULT_PORT : String(port))
  const HOST = process.env.HOST || host || '0.0.0.0'

  // kubb env
  const KUBB_AGENT_ROOT = process.env.KUBB_AGENT_ROOT || process.cwd()
  const KUBB_AGENT_CONFIG = process.env.KUBB_AGENT_CONFIG || configPath || DEFAULT_CONFIG_FILE
  const KUBB_AGENT_ALLOW_WRITE = allowAll || allowWrite ? 'true' : (process.env.KUBB_AGENT_ALLOW_WRITE ?? 'false')
  const KUBB_AGENT_ALLOW_ALL = allowAll ? 'true' : (process.env.KUBB_AGENT_ALLOW_ALL ?? 'false')
  const KUBB_AGENT_TOKEN = process.env.KUBB_AGENT_TOKEN
  const KUBB_AGENT_RETRY_TIMEOUT = process.env.KUBB_AGENT_RETRY_TIMEOUT || DEFAULT_RETRY_TIMEOUT
  const KUBB_STUDIO_URL = process.env.KUBB_STUDIO_URL || DEFAULT_STUDIO_URL

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

  // Spawn the server as a detached long-running child process (fire-and-forget by design)
  spawn('node', [serverPath], {
    env: { ...process.env, ...env },
    stdio: 'inherit',
    cwd: process.cwd(),
  })
}

const command = defineCommand({
  meta: {
    name: 'start',
    description: 'Start the Agent server',
  },
  args,
  async run(commandContext) {
    const { args } = commandContext
    const hrStart = process.hrtime()

    try {
      const configPath = path.resolve(process.cwd(), args.config || DEFAULT_CONFIG_FILE)
      const port = args.port ? Number.parseInt(args.port, 10) : 0
      const host = args.host
      const allowWrite = args['allow-write']
      const allowAll = args['allow-all']

      await startServer({ port, host, configPath, allowWrite, allowAll })
      await sendTelemetry(buildTelemetryEvent({ command: 'agent', kubbVersion: version, hrStart, status: 'success' }))
    } catch (error) {
      await sendTelemetry(buildTelemetryEvent({ command: 'agent', kubbVersion: version, hrStart, status: 'failed' }))
      clack.log.error(styleText('red', 'Failed to start agent server'))
      console.error(error)
      process.exit(1)
    }
  },
})

export default command
