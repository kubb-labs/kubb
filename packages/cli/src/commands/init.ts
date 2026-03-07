import type { ArgsDef } from 'citty'
import { defineCommand } from 'citty'
import { version } from '../../package.json'
import { runInit } from '../runners/init.ts'

const args = {
  yes: {
    type: 'boolean',
    alias: 'y',
    description: 'Skip prompts and use default options',
    default: false,
  },
} as const satisfies ArgsDef

export const command = defineCommand({
  meta: {
    name: 'init',
    description: 'Initialize a new Kubb project with interactive setup',
  },
  args,
  async run({ args }) {
    await runInit({ yes: args.yes, version })
  },
})

