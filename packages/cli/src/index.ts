import { defineCommand, runCommand, runMain } from 'citty'
import boxen from 'boxen'
import { default as gradientString } from 'gradient-string'
import getLatestVersion from 'latest-version'
import { lt } from 'semver'
import { version } from '../package.json'

const name = 'kubb'

const main = defineCommand({
  meta: {
    name,
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
    try {
      console.log(gradientString(['#F58517', '#F5A217', '#F55A17'])('Kubb CLI:'))

      const latestVersion = await getLatestVersion('@kubb/cli')

      if (lt(version, latestVersion)) {
        console.log(
          boxen(
            `\`v${version}\` → \`v${latestVersion}\`\nRun \`npm install -g @kubb/cli\` to update`,
            {
              title: 'Update available for `Kubb`',
              padding: 1,
              borderColor: 'yellow',
              borderStyle: 'round',
            },
          ),
        )
      }
    } catch (_e) {}

    if (!['generate', 'validate', 'mcp'].includes(rawArgs[0] as string)) {
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
  },
})

export async function run(_argv?: string[]): Promise<void> {
  await runMain(main)
}
