import { defineCommand, runCommand, runMain } from 'citty'
import { version } from '../package.json'

const main = defineCommand({
  meta: {
    name: 'kubb',
    version,
    description: 'Kubb generation',
  },
  args: {
    version: {
      type: 'boolean',
      alias: 'v',
      description: 'Show version number',
    },
  },
  async setup({ rawArgs, args }) {
    if (args.version) {
      console.log(version)
      process.exit(0)
    }

    if (!['generate', 'validate', 'mcp', 'init'].includes(rawArgs[0] as string)) {
      // generate is not being used
      const generateCommand = await import('./commands/generate.ts').then((r) => r.default)

      await runCommand(generateCommand, { rawArgs })

      process.exit(0)
    }
  },
  subCommands: {
    generate: () => import('./commands/generate.ts').then((r) => r.default),
    validate: () => import('./commands/validate.ts').then((r) => r.default),
    mcp: () => import('./commands/mcp.ts').then((r) => r.default),
    init: () => import('./commands/init.ts').then((r) => r.default),
  },
})

export async function run(_argv?: string[]): Promise<void> {
  await runMain(main)
}
