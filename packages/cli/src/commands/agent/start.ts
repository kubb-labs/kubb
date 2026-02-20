import path from 'node:path'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'

import * as clack from '@clack/prompts'
import type { ArgsDef } from 'citty'
import { defineCommand } from 'citty'
import { config as loadEnv } from 'dotenv'
import { execa } from 'execa'
import pc from 'picocolors'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string
      KUBB_ROOT: string
      KUBB_STUDIO_URL: string
      KUBB_AGENT_TOKEN: string
      KUBB_CONFIG: string
      KUBB_AGENT_NO_CACHE: string
      KUBB_RETRY_TIMEOUT: string
      KUBB_ALLOW_WRITE: string
      KUBB_ALLOW_ALL: string
    }
  }
}

const args = {
  config: {
    type: 'string',
    description: 'Path to the Kubb config',
    alias: 'c',
  },
  port: {
    type: 'string',
    description: 'Port for the server. If not specified, an available port is automatically selected.',
    alias: 'p',
  },
  host: {
    type: 'string',
    description: 'Host for the server',
    default: 'localhost',
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
  noCache: boolean
  allowWrite: boolean
  allowAll: boolean
}

async function startServer({ port, host, configPath, noCache, allowWrite, allowAll }: StartServerProps): Promise<void> {
  try {
    // Load .env files into process.env (supports .env, .env.local, .env.*.local)
    loadEnv() // .env

    // Resolve the @kubb/agent package path
    const agentPkgUrl = import.meta.resolve('@kubb/agent/package.json')
    const agentPkgPath = fileURLToPath(agentPkgUrl)
    const agentDir = path.dirname(agentPkgPath)
    const serverPath = path.join(agentDir, '.output', 'server', 'index.mjs')

    // nitro env
    const PORT = process.env.PORT || (port === 0 ? '3000' : String(port))
    const HOST = process.env.HOST || host || '0.0.0.0'

    // kubb env
    const KUBB_ROOT = process.env.KUBB_ROOT || process.cwd()
    const KUBB_CONFIG = process.env.KUBB_CONFIG || configPath || 'kubb.config.ts'
    const KUBB_AGENT_NO_CACHE = noCache ? 'true' : 'false'
    const KUBB_ALLOW_WRITE = allowAll || allowWrite ? 'true' : (process.env.KUBB_ALLOW_WRITE ?? 'false')
    const KUBB_ALLOW_ALL = allowAll ? 'true' : (process.env.KUBB_ALLOW_ALL ?? 'false')
    const KUBB_STUDIO_URL = process.env.KUBB_STUDIO_URL || 'https://studio.kubb.dev'
    const KUBB_AGENT_TOKEN = process.env.KUBB_AGENT_TOKEN
    const KUBB_RETRY_TIMEOUT = process.env.KUBB_RETRY_TIMEOUT || '30000'

    // Set environment variables
    const env = {
      KUBB_ROOT,
      KUBB_CONFIG,
      PORT,
      HOST,
      KUBB_STUDIO_URL,
      KUBB_RETRY_TIMEOUT,
      KUBB_AGENT_NO_CACHE,
      KUBB_AGENT_TOKEN,
      KUBB_ALLOW_WRITE,
      KUBB_ALLOW_ALL,
    }

    clack.log.step(pc.cyan('Starting agent server...'))
    clack.log.info(pc.dim(`Config: ${KUBB_CONFIG}`))
    clack.log.info(pc.dim(`Host: ${HOST}`))
    clack.log.info(pc.dim(`Port: ${PORT}`))
    if (noCache) {
      clack.log.info(pc.dim('Session caching: disabled'))
    }
    if (!allowWrite && !allowAll) {
      clack.log.warn(pc.yellow('Filesystem writes disabled. Use --allow-write or --allow-all to enable.'))
    }

    // Use execa to spawn the server process
    await execa('node', [serverPath], {
      env,
      stdio: 'inherit',
      cwd: process.cwd(),
    })
  } catch (error) {
    console.error('Failed to start agent server:', error)
    process.exit(1)
  }
}

const command = defineCommand({
  meta: {
    name: 'start',
    description: 'Start the Agent server',
  },
  args,
  async run(commandContext) {
    const { args } = commandContext

    try {
      const configPath = path.resolve(process.cwd(), args.config || 'kubb.config.ts')
      const port = args.port ? Number.parseInt(args.port, 10) : 0
      const host = args.host
      const noCache = args['no-cache']
      const allowWrite = args['allow-write']
      const allowAll = args['allow-all']

      await startServer({ port, host, configPath, noCache, allowWrite, allowAll })
    } catch (error) {
      clack.log.error(pc.red('Failed to start agent server'))
      console.error(error)
      process.exit(1)
    }
  },
})

export default command
