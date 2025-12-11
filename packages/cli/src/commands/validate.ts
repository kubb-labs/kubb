import process from 'node:process'
import type { ArgsDef, ParsedArgs } from 'citty'
import { defineCommand, showUsage } from 'citty'
import { log } from '@clack/prompts'
import { createJiti } from 'jiti'

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

export type Args = ParsedArgs<typeof args>

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
        log.error(`Import of '@kubb/oas' is required to do validation`)
      }

      const { parse } = mod
      try {
        const oas = await parse(args.input)
        await oas.valdiate()

        log.success('Validation success')
      } catch (e) {
        log.error('Validation failed')
        console.log((e as Error)?.message)
        process.exit(1)
      }
    }
  },
})

export default command
