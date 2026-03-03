import process from 'node:process'
import type { ArgsDef } from 'citty'
import { defineCommand, showUsage } from 'citty'
import { createJiti } from 'jiti'
import { version } from '../../package.json'
import { buildTelemetryEvent, sendTelemetry } from '../utils/telemetry.ts'

const jiti = createJiti(import.meta.url, {
  sourceMaps: true,
})

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

const command = defineCommand({
  meta: {
    name: 'validate',
    description: 'Validate a Swagger/OpenAPI file',
  },
  args,
  async run(commandContext) {
    const { args } = commandContext

    if (args.help) {
      return showUsage(command)
    }

    if (args.input) {
      let mod: any
      try {
        mod = await jiti.import('@kubb/oas', { default: true })
      } catch (_e) {
        console.error(`Import of '@kubb/oas' is required to do validation`)
        process.exit(1)
      }

      const { parse } = mod
      const hrStart = process.hrtime()
      try {
        const oas = await parse(args.input)
        await oas.validate()

        await sendTelemetry(buildTelemetryEvent({ command: 'validate', kubbVersion: version, hrStart, status: 'success' }))
        console.log('✅ Validation success')
      } catch (error) {
        await sendTelemetry(buildTelemetryEvent({ command: 'validate', kubbVersion: version, hrStart, status: 'failed' }))
        console.error('❌ Validation failed')
        console.log((error as Error)?.message)
        process.exit(1)
      }
    }
  },
})

export default command
