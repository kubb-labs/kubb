import process from 'node:process'
import { styleText } from 'node:util'
import type { ArgsDef } from 'citty'
import { defineCommand, showUsage } from 'citty'
import type * as McpModule from '@kubb/mcp'
import { version } from '../../package.json'
import { getErrorMessage } from '../utils/errors.ts'
import { buildTelemetryEvent, sendTelemetry } from '../utils/telemetry.ts'
import { jiti } from '../utils/jiti.ts'

const args = {
  help: {
    type: 'boolean',
    description: 'Show help',
    alias: 'h',
    default: false,
  },
} as const satisfies ArgsDef

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

    let mod: typeof McpModule
    try {
      mod = await jiti.import('@kubb/mcp', { default: true }) as typeof McpModule
    } catch (_e) {
      console.error(`Import of '@kubb/mcp' is required to start the MCP server`)
      process.exit(1)
    }

    const { run } = mod
    const hrStart = process.hrtime()
    try {
      console.log('⏳ Starting MCP server...')
      console.warn(styleText('yellow', 'This feature is still under development — use with caution'))
      run()
      await sendTelemetry(buildTelemetryEvent({ command: 'mcp', kubbVersion: version, hrStart, status: 'success' }))
    } catch (error) {
      await sendTelemetry(buildTelemetryEvent({ command: 'mcp', kubbVersion: version, hrStart, status: 'failed' }))
      console.error(getErrorMessage(error))
    }
  },
})

export default command
