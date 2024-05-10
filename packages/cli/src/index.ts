import { defineCommand, runCommand, runMain } from 'citty'
import getLatestVersion from 'latest-version'
import { lt } from 'semver'

import consola from 'consola'
import { version } from '../package.json'

const name = 'kubb'

const main = defineCommand({
  meta: {
    name,
    version,
    description: 'Kubb generation',
  },
  async setup({ rawArgs }) {
   try{
     const latestVersion = await getLatestVersion('@kubb/cli')

     if (lt(version, latestVersion)) {
       consola.box({
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
   }catch(_e){

   }

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
