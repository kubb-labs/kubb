import { defineCommand, showUsage } from 'citty'
import type { ArgsDef, ParsedArgs } from 'citty'

import { LogMapper, createLogger } from '@kubb/core/logger'

declare global {
  var isDevtoolsEnabled: any
}

const args = {
  debug: {
    type: 'boolean',
    description: 'Override logLevel to debug',
    alias: 'd',
    default: false,
  },
  help: {
    type: 'boolean',
    description: 'Show help',
    alias: 'h',
    default: false,
  },
} as const satisfies ArgsDef

export type Args = ParsedArgs<typeof args>

const command = defineCommand({
  meta: {
    name: 'mcp',
    description: 'Start the MCP server for Kubb LLM',
  },
  args,
  async run(commandContext) {
    const { args } = commandContext

    // const input = args._[0]

    if (args.help) {
      return showUsage(command)
    }

    if (args.debug) {
      args.logLevel = 'debug'
    }

    const logLevel = LogMapper[args.logLevel as keyof typeof LogMapper] || 3
    const logger = createLogger({
      logLevel,
    })

    try {
      const { startServer } = await import('@kubb/mcp')

      return startServer()
    } catch (e) {
      logger.consola?.error('Cannot load `@kubb/mcp`, you need to first install `@kubb/mcp`')
    }
  },
})

export default command
