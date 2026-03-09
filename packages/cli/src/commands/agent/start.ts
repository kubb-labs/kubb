import path from 'node:path'
import { defineCommand } from '@internals/utils'
import { version } from '../../../package.json'
import { agentDefaults } from '../../constants.ts'

export const command = defineCommand({
  name: 'start',
  description: 'Start the Agent server',
  options: {
    config: { type: 'string', description: 'Path to the Kubb config', short: 'c' },
    port: { type: 'string', description: `Port for the server (default: ${agentDefaults.port})`, short: 'p' },
    host: { type: 'string', description: 'Host for the server', default: agentDefaults.host },
    'allow-write': {
      type: 'boolean',
      description: 'Allow writing generated files to the filesystem. When not set, no files are written and the config patch is not persisted.',
      default: false,
    },
    'allow-all': { type: 'boolean', description: 'Grant all permissions (implies --allow-write).', default: false },
  },
  async run({ values }) {
    const { runAgentStart } = await import('../../runners/agent.ts')

    await runAgentStart({
      port: values.port !== undefined ? values.port : undefined,
      host: values.host,
      configPath: path.resolve(process.cwd(), values.config ?? agentDefaults.configFile),
      allowWrite: values['allow-write'],
      allowAll: values['allow-all'],
      version,
    })
  },
})
