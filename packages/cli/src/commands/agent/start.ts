import path from 'node:path'
import * as process from 'node:process'

import * as clack from '@clack/prompts'
import type { ArgsDef } from 'citty'
import { defineCommand } from 'citty'
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

async function startServer(port: number, host: string, configPath: string, noCache: boolean): Promise<void> {
  try {
    // Resolve the @kubb/agent package path using import.meta.resolve
    const agentPkg = await import.meta.resolve('@kubb/agent')
    const agentDir = path.dirname(agentPkg)
    const serverPath = path.join(agentDir, '.output', 'server', 'index.mjs')

    // Set environment variables
    const env = {
      ...process.env,
      KUBB_CONFIG: configPath,
      PORT: port === 0 ? '3000' : String(port),
      HOST: host,
      ...(noCache && { KUBB_AGENT_NO_CACHE: 'true' }),
    }

    clack.log.step(pc.cyan('Starting agent server...'))
    clack.log.info(pc.dim(`Config: ${path.relative(process.cwd(), configPath)}`))
    clack.log.info(pc.dim(`Host: ${host}`))
    clack.log.info(pc.dim(`Port: ${port === 0 ? '3000 (auto)' : port}`))
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
      // Resolve config path
      let configPath = args.config || 'kubb.config.ts'
      configPath = path.resolve(process.cwd(), configPath)

      const port = args.port ? Number.parseInt(args.port, 10) : 0
      const host = args.host
      const noCache = args['no-cache']

      await startServer(port, host, configPath, noCache)
    } catch (error) {
      clack.log.error(pc.red('Failed to start agent server'))
      console.error(error)
      process.exit(1)
    }
  },
})

export default command
