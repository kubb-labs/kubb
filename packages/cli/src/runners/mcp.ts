import process from 'node:process'
import { styleText } from 'node:util'
import type * as McpModule from '@kubb/mcp'
import { getErrorMessage } from '@kubb/utils'
import { jiti } from '../utils/jiti.ts'
import { buildTelemetryEvent, sendTelemetry } from '../utils/telemetry.ts'

type McpOptions = {
  version: string
}

export async function runMcp({ version }: McpOptions): Promise<void> {
  let mod: typeof McpModule
  try {
    mod = (await jiti.import('@kubb/mcp', { default: true })) as typeof McpModule
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
}
