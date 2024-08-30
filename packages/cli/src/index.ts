import { defineCommand, runCommand, runMain } from 'citty'
import getLatestVersion from 'latest-version'
import { lt } from 'semver'

import { version } from '../package.json'
import { logger } from './utils/logger.ts'

const name = 'kubb'

process.on('SIGINT', async () => {
  logger.consola?.info('Exiting Kubb and writing log files')

  await logger.writeLogs()

  process.exit()
})

const main = defineCommand({
  meta: {
    name,
    version,
    description: 'Kubb generation',
  },
  async setup({ rawArgs }) {
    try {
      const latestVersion = await getLatestVersion('@kubb/cli')

      if (lt(version, latestVersion)) {
        logger.consola?.box({
          title: 'Update available for `Kubb` ',
          message: `\`v${version}\` → \`v${latestVersion}\`
Run \`npm install -g @kubb/cli\` to update`,
          style: {
            padding: 2,
            borderColor: 'yellow',
            borderStyle: 'rounded',
          },
        })
      }
    } catch (_e) {}

    if (rawArgs[0] !== 'generate') {
      // generate is not being used
      const generateCommand = await import('./commands/generate.ts').then((r) => r.default)

      await runCommand(generateCommand, { rawArgs })

      process.exit(0)
    }
  },
  subCommands: {
    generate: () => import('./commands/generate.ts').then((r) => r.default),
  },
})

export async function run(_argv?: string[]): Promise<void> {
  await runMain(main)
}

export { generate } from './generate.ts'
