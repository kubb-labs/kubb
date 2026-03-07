import path from 'node:path'
import * as process from 'node:process'
import { version } from '../../../package.json'
import { defineCommand } from '../../cli/index.ts'
import { agentDefaults } from '../../constants.ts'
import { runAgentStart } from '../../runners/agent.ts'

export const command = defineCommand({
  name: 'start',
  description: 'Start the Agent server',
  options: {
    config: {
      type: 'string',
      description: 'Path to the Kubb config',
      short: 'c',
    },
    port: {
      type: 'string',
      description: `Port for the server (default: ${agentDefaults.port})`,
      short: 'p',
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
  },
  async run({ values }) {
    const configPath = path.resolve(process.cwd(), (values['config'] as string | undefined) || agentDefaults.configFile)
    const port = values['port'] ? Number.parseInt(values['port'] as string, 10) : 0

    await runAgentStart({
      port,
      host: (values['host'] as string | undefined) ?? agentDefaults.host,
      configPath,
      allowWrite: !!(values['allow-write'] as boolean | undefined),
      allowAll: !!(values['allow-all'] as boolean | undefined),
      version,
    })
  },
})
