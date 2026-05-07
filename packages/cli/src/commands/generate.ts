import { defineCommand } from '@internals/utils'

export const command = defineCommand({
  name: 'generate',
  description: "[input] Generate files based on a 'kubb.config.ts' file",
  arguments: ['[input]'],
  options: {
    config: {
      type: 'string',
      description: 'Path to the Kubb config',
      short: 'c',
    },
    adapter: {
      type: 'string',
      description: 'Adapter to use for generation',
      enum: ['oas'],
    },
    logLevel: {
      type: 'string',
      description: 'Info, silent, verbose or debug',
      short: 'l',
      default: 'info',
      hint: 'silent|info|verbose|debug',
      enum: ['silent', 'info', 'verbose', 'debug'],
    },
    watch: {
      type: 'boolean',
      description: 'Watch mode based on the input file',
      short: 'w',
      default: false,
    },
    debug: {
      type: 'boolean',
      description: 'Override logLevel to debug',
      short: 'd',
      default: false,
    },
    verbose: {
      type: 'boolean',
      description: 'Override logLevel to verbose',
      short: 'v',
      default: false,
    },
    silent: {
      type: 'boolean',
      description: 'Override logLevel to silent',
      short: 's',
      default: false,
    },
  },
  async run({ values, positionals }) {
    const adapter = values.adapter === 'oas' ? 'oas' : undefined
    const logLevel = values.debug ? 'debug' : values.verbose ? 'verbose' : values.silent ? 'silent' : values.logLevel
    const { runGenerateCommand } = await import('../runners/generate.ts')

    await runGenerateCommand({
      adapter,
      input: positionals[0],
      configPath: values.config,
      logLevel,
      watch: values.watch,
    })
  },
})
