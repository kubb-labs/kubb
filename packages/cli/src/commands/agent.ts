import type { ArgsDef } from 'citty'
import { defineCommand, showUsage } from 'citty'
import { createJiti } from 'jiti'
import pc from 'picocolors'

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

const command = defineCommand({
  meta: {
    name: 'agent',
    description: 'Start the Kubb Agent server for HTTP-based code generation.',
  },
  args,
  async run(commandContext) {
    const { args } = commandContext

    if (args.help) {
      return showUsage(command)
    }

    let mod: any
    try {
      mod = await jiti.import('@kubb/agent', { default: true })
    } catch (_e) {
      console.error(`Import of '@kubb/agent' is required to start the Agent server`)
      process.exit(1)
    }

    const { run } = mod
    try {
      console.log('⏳ Starting Agent server...')
      console.warn(pc.yellow('This feature is still under development — use with caution'))
      await run()
    } catch (error) {
      console.error((error as Error)?.message)
    }
  },
})

export default command
