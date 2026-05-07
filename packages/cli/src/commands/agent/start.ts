import { defineCommand } from '@internals/utils'
import { version } from '../../../package.json'
import { agentDefaults } from '../../constants.ts'

export const command = defineCommand({
  name: 'start',
  description:
    'Start the Kubb Agent HTTP server. Exposes a REST API that accepts a kubb.config.ts patch and returns generated code as a stream. Use --allow-write to also write files to disk.',
  examples: ['kubb agent start', 'kubb agent start --port 4000', 'kubb agent start --allow-write', 'kubb agent start --config ./kubb.config.ts --allow-all'],
  options: {
    config: {
      type: 'string',
      description: 'Path to the Kubb config file',
      short: 'c',
    },
    port: {
      type: 'string',
      description: 'Port the HTTP server listens on',
      short: 'p',
      default: agentDefaults.port,
    },
    host: {
      type: 'string',
      description: 'Hostname the HTTP server binds to',
      default: agentDefaults.host,
    },
    'allow-write': {
      type: 'boolean',
      description: 'Write generated files to the filesystem. When omitted, output is streamed only and no files are written.',
      default: false,
    },
    'allow-all': {
      type: 'boolean',
      description: 'Grant all permissions (implies --allow-write).',
      default: false,
    },
  },
  async run({ values }) {
    const { runAgentStart } = await import('../../runners/agent.ts')

    await runAgentStart({
      port: values.port !== undefined ? values.port : undefined,
      host: values.host,
      configPath: values.config,
      allowWrite: values['allow-write'],
      allowAll: values['allow-all'],
      version,
    })
  },
})
