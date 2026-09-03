import process from 'node:process'
import { styleText } from 'node:util'
import { toError } from '@internals/utils'
import type * as McpModule from '@kubb/mcp'
import type { CommandRunner } from 'gunshi'
import { buildTelemetryEvent, sendTelemetry } from '../../Telemetry.ts'
import { version } from '../../../package.json'
import type { definition } from '../../commands/mcp.ts'

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
  const report = (status: 'success' | 'failed') => sendTelemetry(buildTelemetryEvent({ command: 'mcp', kubbVersion: version, hrStart, status }))

  try {
    console.log(styleText('cyan', '⏳ Starting MCP server...'))
    console.warn(styleText('yellow', 'This feature is still under development, use with caution'))

    await startMcpServer()
    await report('success')
  } catch (error) {
    await report('failed')
    console.error(toError(error).message)
    process.exitCode = 1
  }
}

/**
 * Loaded on demand by `index.ts`, so `@kubb/mcp` stays out of the process for every other command.
 */
export const runner: CommandRunner<{ args: typeof definition.args; extensions: {} }> = async () => {
  await run({ version })
}
