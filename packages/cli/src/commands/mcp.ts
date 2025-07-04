import type { ArgsDef, ParsedArgs } from 'citty'
import { defineCommand, showUsage } from 'citty'
import consola from 'consola'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url, {
  sourceMaps: true,
})

const args = {
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
    description: 'Start the server to enable the MCP client to interact with the LLM.',
  },
  args,
  async run(commandContext) {
    const { args } = commandContext

    if (args.help) {
      return showUsage(command)
    }

    let mod: any
    try {
      mod = await jiti.import('@kubb/mcp', { default: true })
    } catch (_e) {
      consola.error(`Import of '@kubb/mcp' is required to start the MCP server`)
    }

    const { startServer } = mod
    try {
      consola.start('Starting MCP server...')
      consola.warn('This feature is still under development — use with caution')
      await startServer()
    } catch (e) {
      consola.error((e as Error)?.message)
    }
  },
})

export default command
