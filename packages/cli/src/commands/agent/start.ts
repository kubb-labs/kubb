import path from 'node:path'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'

import * as clack from '@clack/prompts'
import type { ArgsDef } from 'citty'
import { defineCommand } from 'citty'
import { config as loadEnv } from 'dotenv'
import { execa } from 'execa'
import pc from 'picocolors'

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
} as const satisfies ArgsDef

type StartServerProps = {
  port: number
  host: string
  configPath: string
  noCache: boolean
}

async function startServer({ port, host, configPath, noCache }: StartServerProps): Promise<void> {
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
    const KUBB_ROOT = process.env.KUBB_ROOT
    const KUBB_CONFIG = process.env.KUBB_CONFIG || configPath || 'kubb.config.ts'
    const KUBB_AGENT_NO_CACHE = noCache ? 'true' : 'false'
    const KUBB_STUDIO_URL = process.env.KUBB_STUDIO_URL || 'https://studio.kubb.dev'
    const KUBB_AGENT_TOKEN = process.env.KUBB_AGENT_TOKEN

    // Set environment variables
    const env = {
      KUBB_ROOT,
      KUBB_CONFIG,
      PORT,
      HOST,
      KUBB_STUDIO_URL,
      KUBB_AGENT_NO_CACHE,
      KUBB_AGENT_TOKEN,
    }

    clack.log.step(pc.cyan('Starting agent server...'))
    clack.log.info(pc.dim(`Config: ${KUBB_CONFIG}`))
    clack.log.info(pc.dim(`Host: ${HOST}`))
    clack.log.info(pc.dim(`Port: ${PORT}`))
    if (noCache) {
      clack.log.info(pc.dim('Session caching: disabled'))
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

      await startServer({ port, host, configPath, noCache })
    } catch (error) {
      clack.log.error(pc.red('Failed to start agent server'))
      console.error(error)
      process.exit(1)
    }
  },
})

export default command
