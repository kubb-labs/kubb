import process from 'node:process'
import { styleText } from 'node:util'
import { toError } from '@internals/utils'
import type * as McpModule from '@kubb/mcp'
import { trackRun } from '../../Telemetry.ts'

/**
 * Starts the `@kubb/mcp` server over stdio and reports the outcome to telemetry.
 */
export async function run(): Promise<void> {
  const { run: startMcpServer } = (await import('@kubb/mcp')) as typeof McpModule

  const report = trackRun({ command: 'mcp', hrStart: process.hrtime() })

  try {
    // The MCP stdio transport owns stdout: anything else written there corrupts the JSON-RPC stream.
    console.error(styleText('cyan', '⏳ Starting MCP server...'))
    console.warn(styleText('yellow', 'This feature is still under development, use with caution'))
    const server = startMcpServer()
    // Report once the client introduces itself, so the event names the client (e.g. `claude-code`, `cursor-vscode`).
    server.on('initialize', ({ clientInfo }) => void report({ status: 'success', mcpClient: clientInfo.name }), { once: true })
  } catch (error) {
    await report({ status: 'failed' })
    console.error(toError(error).message)
    process.exitCode = 1
  }
}
