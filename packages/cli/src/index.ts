import { styleText } from 'node:util'
import { defineCommand, runCommand, runMain } from 'citty'
import { version } from '../package.json'
import { isTelemetryDisabled } from './utils/telemetry.ts'

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

    if (!isTelemetryDisabled()) {
      console.log(
        `${styleText('yellow', 'Notice:')} Kubb collects anonymous telemetry data to help improve the tool. No personal data or file contents are collected. \nTo disable, set ${styleText('cyan', 'KUBB_DISABLE_TELEMETRY=1')}.\n`,
      )
    }

    const knownSubcommands = ['generate', 'validate', 'mcp', 'agent', 'init'] as const

    if (!knownSubcommands.includes(rawArgs[0] as (typeof knownSubcommands)[number])) {
      // No subcommand given — fall back to `generate` as the default command
      const generateCommand = await import('./commands/generate.ts').then((r) => r.default)

      await runCommand(generateCommand, { rawArgs })

      process.exit(0)
    }
  },
  subCommands: {
    generate: () => import('./commands/generate.ts').then((r) => r.default),
    validate: () => import('./commands/validate.ts').then((r) => r.default),
    mcp: () => import('./commands/mcp.ts').then((r) => r.default),
    agent: () => import('./commands/agent.ts').then((r) => r.default),
    init: () => import('./commands/init.ts').then((r) => r.default),
  },
})

export async function run(_argv?: string[]): Promise<void> {
  await runMain(main)
}
