import process from 'node:process'
import { styleText } from 'node:util'
import { getErrorMessage } from '@internals/utils'
import { Telemetry } from '../../Telemetry.ts'
import type * as McpModule from '@kubb/mcp'

type McpOptions = {
  /**
   * Current `@kubb/cli` version string, used for the telemetry payload.
   */
  version: string
}

/**
 * Starts the `@kubb/mcp` server over stdio and reports the outcome to telemetry.
 */
export async function run({ version }: McpOptions): Promise<void> {
  const { run: startMcpServer } = (await import('@kubb/mcp')) as typeof McpModule

  const hrStart = process.hrtime()
  const report = (status: 'success' | 'failed') => Telemetry.send(Telemetry.build({ command: 'mcp', kubbVersion: version, hrStart, status }))

  try {
    console.log(styleText('cyan', '⏳ Starting MCP server...'))
    console.warn(styleText('yellow', 'This feature is still under development, use with caution'))

    await startMcpServer()
    await report('success')
  } catch (error) {
    await report('failed')
    console.error(getErrorMessage(error))
  }
}
