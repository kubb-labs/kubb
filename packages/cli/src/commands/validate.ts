import type { ArgsDef } from 'citty'
import { defineCommand, showUsage } from 'citty'
import { version } from '../../package.json'
import { runValidate } from '../runners/validate.ts'

const args = {
  input: {
    type: 'string',
    description: 'Path to Swagger/OpenAPI file',
    alias: 'i',
  },
  help: {
    type: 'boolean',
    description: 'Show help',
    alias: 'h',
    default: false,
  },
} as const satisfies ArgsDef

export const command = defineCommand({
  meta: {
    name: 'validate',
    description: 'Validate a Swagger/OpenAPI file',
  },
  args,
  async run({ args }) {
    if (args.help) {
      return showUsage(command)
    }

    if (!args.input) {
      console.error('Error: --input <path> is required')
      return showUsage(command)
    }

    await runValidate({ input: args.input, version })
  },
})

