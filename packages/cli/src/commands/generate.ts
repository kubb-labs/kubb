import { defineCommand } from '../cli/index.ts'
import { runGenerateCommand } from '../runners/generate.ts'

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
    logLevel: {
      type: 'string',
      description: 'Info, silent, verbose or debug',
      short: 'l',
      default: 'info',
      hint: 'silent|info|verbose|debug',
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
    const { LogLevel } = await import('@kubb/core')

    const logLevelName = values['debug']
      ? 'debug'
      : values['verbose']
        ? 'verbose'
        : values['silent']
          ? 'silent'
          : ((values['logLevel'] as string | undefined) ?? 'info')

    const logLevel = LogLevel[logLevelName as keyof typeof LogLevel] ?? LogLevel.info

    await runGenerateCommand({
      input: positionals[0],
      configPath: values['config'] as string | undefined,
      logLevel,
      watch: !!(values['watch'] as boolean | undefined),
    })
  },
})
