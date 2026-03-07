import type { ArgsDef } from 'citty'
import { defineCommand, showUsage } from 'citty'

const args = {
  help: {
    type: 'boolean',
    description: 'Show help',
    alias: 'h',
    default: false,
  },
} as const satisfies ArgsDef

export const command = defineCommand({
  args,
  subCommands: {
    start: () => import('./agent/start.ts').then((m) => m.command),
  },
  async run({ args }) {
    if (args.help) {
      return showUsage(command)
    }
  },
})

