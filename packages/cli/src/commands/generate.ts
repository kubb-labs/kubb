import type { ArgsDef } from 'citty'
import { defineCommand, showUsage } from 'citty'
import { runGenerateCommand } from '../runners/generate.ts'

const args = {
  config: {
    type: 'string',
    description: 'Path to the Kubb config',
    alias: 'c',
  },
  logLevel: {
    type: 'string',
    description: 'Info, silent, verbose or debug',
    alias: 'l',
    default: 'info',
    valueHint: 'silent|info|verbose|debug',
  },
  watch: {
    type: 'boolean',
    description: 'Watch mode based on the input file',
    alias: 'w',
    default: false,
  },
  debug: {
    type: 'boolean',
    description: 'Override logLevel to debug',
    alias: 'd',
    default: false,
  },
  verbose: {
    type: 'boolean',
    description: 'Override logLevel to verbose',
    alias: 'v',
    default: false,
  },
  silent: {
    type: 'boolean',
    description: 'Override logLevel to silent',
    alias: 's',
    default: false,
  },
  help: {
    type: 'boolean',
    description: 'Show help',
    alias: 'h',
    default: false,
  },
} as const satisfies ArgsDef

export const command = defineCommand({
  meta: {
    name: 'generate',
    description: "[input] Generate files based on a 'kubb.config.ts' file",
  },
  args,
  async run({ args }) {
    if (args.help) {
      return showUsage(command)
    }

    const { LogLevel } = await import('@kubb/core')
    const resolvedLogLevelName = args.debug ? 'debug' : args.verbose ? 'verbose' : args.silent ? 'silent' : args.logLevel
    const logLevel = LogLevel[resolvedLogLevelName as keyof typeof LogLevel] ?? LogLevel.info

    await runGenerateCommand({
      input: args._[0],
      configPath: args.config,
      logLevel,
      watch: args.watch,
    })
  },
})

