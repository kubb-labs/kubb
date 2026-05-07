import { defineCommand } from '@internals/utils'
import { command as startCommand } from './agent/start.ts'

export const command = defineCommand({
  name: 'agent',
  description:
    'Manage the Kubb Agent — an HTTP server that lets AI agents trigger code generation programmatically via a REST API. Useful when an AI workflow needs to generate code without direct CLI access.',
  examples: ['kubb agent start', 'kubb agent start --port 4000 --allow-write', 'kubb agent start --config ./kubb.config.ts --allow-all'],
  subCommands: [startCommand],
})
