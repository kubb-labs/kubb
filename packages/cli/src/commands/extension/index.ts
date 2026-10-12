import { define } from 'gunshi'
import { command as buildCommand } from './build.ts'

export const command = define({
  name: 'extension',
  description: 'Build the kubb.json manifest of a package with Kubb plugins, adapters or parsers.',
  examples: ['kubb extension build', 'kubb extension build --check'].join('\n'),
  run() {
    console.log('Run `kubb extension build` to write dist/kubb.json. See `kubb extension build --help` for its options.')
  },
  subCommands: {
    build: buildCommand,
  },
})
