import path from 'node:path'
import * as process from 'node:process'
import type { ArgsDef } from 'citty'
import { defineCommand } from 'citty'
import { version } from '../../../package.json'
import { agentDefaults } from '../../constants.ts'
import { runAgentStart } from '../../runners/agent.ts'

const args = {
  config: {
    type: 'string',
    description: 'Path to the Kubb config',
    alias: 'c',
  },
  port: {
    type: 'string',
    description: `Port for the server (default: ${agentDefaults.port})`,
    alias: 'p',
  },
  host: {
    type: 'string',
    description: 'Host for the server',
    default: agentDefaults.host,
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

export const command = defineCommand({
  meta: {
    name: 'start',
    description: 'Start the Agent server',
  },
  args,
  async run({ args }) {
    const configPath = path.resolve(process.cwd(), args.config || agentDefaults.configFile)
    const port = args.port ? Number.parseInt(args.port, 10) : 0

    await runAgentStart({
      port,
      host: args.host,
      configPath,
      allowWrite: args['allow-write'],
      allowAll: args['allow-all'],
      version,
    })
  },
})

