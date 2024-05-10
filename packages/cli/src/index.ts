import { defineCommand, runCommand, runMain } from 'citty'

import { version } from '../package.json'

const name = 'kubb'

const main = defineCommand({
  meta: {
    name,
    version,
    description: 'Kubb generation',
  },
  async setup({ rawArgs }){
    if(rawArgs[0]!=="generate"){
      // generate is not being used
      const generateCommand =await import('./commands/generate.ts').then((r) => r.default)

      await runCommand(generateCommand,{rawArgs})
      
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
