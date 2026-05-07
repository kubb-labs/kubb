import { defineCommand } from '@internals/utils'
import { version } from '../../../package.json'
import { agentDefaults } from '../../constants.ts'

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
    'permission.filesystem': {
      type: 'boolean',
      description: 'Allow writing generated files to the filesystem. When not set, no files are written and the config patch is not persisted.',
      default: false,
    },
    'permission.yolo': {
      type: 'boolean',
      description: 'Grant all active permissions (currently implies --permission.filesystem).',
      default: false,
    },
  },
  async run({ values }) {
    const { runAgentStart } = await import('../../runners/agent.ts')

    await runAgentStart({
      port: values.port !== undefined ? values.port : undefined,
      host: values.host,
      configPath: values.config,
      permission: {
        filesystem: values['permission.filesystem'],
        yolo: values['permission.yolo'],
      },
      version,
    })
  },
})
