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
    'permission.publish': {
      type: 'boolean',
      description: 'Allow running publish commands (e.g. npm publish).',
      default: false,
    },
    'permission.yolo': {
      type: 'boolean',
      description: 'Grant all permissions (implies --permission.filesystem and --permission.publish).',
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
        publish: values['permission.publish'],
        yolo: values['permission.yolo'],
      },
      version,
    })
  },
})
