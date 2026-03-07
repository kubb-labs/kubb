import { version } from '../../package.json'
import { defineCommand } from '../cli/index.ts'

export const command = defineCommand({
  name: 'init',
  description: 'Initialize a new Kubb project with interactive setup',
  options: {
    yes: { type: 'boolean', description: 'Skip prompts and use default options', short: 'y', default: false },
  },
  async run({ values }) {
    const { runInit } = await import('../runners/init.ts')

    await runInit({ yes: values.yes, version })
  },
})
