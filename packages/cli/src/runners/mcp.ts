import process from 'node:process'
import { styleText } from 'node:util'
import { getErrorMessage } from '@internals/utils'
import type * as McpModule from '@kubb/mcp'
import { buildTelemetryEvent, sendTelemetry } from '../utils/telemetry.ts'

type McpOptions = {
  version: string
}

export async function runMcp({ version }: McpOptions): Promise<void> {
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

  const { run } = mod
  const hrStart = process.hrtime()
  try {
    console.log('⏳ Starting MCP server...')
    console.warn(styleText('yellow', 'This feature is still under development — use with caution'))
    run()
    await sendTelemetry(
      buildTelemetryEvent({
        command: 'mcp',
        kubbVersion: version,
        hrStart,
        status: 'success',
      }),
    )
  } catch (error) {
    await sendTelemetry(
      buildTelemetryEvent({
        command: 'mcp',
        kubbVersion: version,
        hrStart,
        status: 'failed',
      }),
    )
    console.error(getErrorMessage(error))
  }
}
