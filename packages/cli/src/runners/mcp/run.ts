import process from 'node:process'
import { styleText } from 'node:util'
import { getErrorMessage } from '@internals/utils'
import type * as McpModule from '@kubb/mcp'
import { buildTelemetryEvent, sendTelemetry } from '../../telemetry.ts'

type McpOptions = {
  /**
   * Current `@kubb/cli` version string, used for the telemetry payload.
   */
  version: string
  /**
   * TCP port for the HTTP MCP server. When `undefined`, the server uses stdio transport.
   */
  port?: string
  /**
   * Hostname to bind to when running in HTTP mode.
   *
   * @default 'localhost'
   */
  host?: string
}

/**
 * Starts the Kubb MCP server using `@kubb/mcp`.
 * Exits the process with code 1 if `@kubb/mcp` is not installed.
 */
export async function run({ version, port, host }: McpOptions): Promise<void> {
  let mod: typeof McpModule
  try {
    mod = (await import('@kubb/mcp')) as typeof McpModule
  } catch (_e) {
    console.error(styleText('red', 'The @kubb/mcp package is not installed.'))
    console.error('')
    console.error('Install it with:')
    console.error(styleText('cyan', '  npm install @kubb/mcp'))
    console.error(styleText('cyan', '  # or'))
    console.error(styleText('cyan', '  pnpm install @kubb/mcp'))
    console.error('')
    process.exit(1)
  }

  const { run: startMcpServer } = mod
  const hrStart = process.hrtime()
  const report = (status: 'success' | 'failed') => sendTelemetry(buildTelemetryEvent({ command: 'mcp', kubbVersion: version, hrStart, status }))
  try {
    console.log(styleText('cyan', '⏳ Starting MCP server...'))
    console.warn(styleText('yellow', 'This feature is still under development, use with caution'))
    await startMcpServer(undefined, { port: port !== undefined ? Number(port) : undefined, host })
    await report('success')
  } catch (error) {
    await report('failed')
    console.error(getErrorMessage(error))
  }
}
