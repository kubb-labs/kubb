import * as process from 'node:process'
import * as clack from '@clack/prompts'
import type { ArgsDef, ParsedArgs } from 'citty'
import { defineCommand, showUsage } from 'citty'
import pc from 'picocolors'
import { getConfigs } from '../utils/getConfigs.ts'
import { getCosmiConfig } from '../utils/getCosmiConfig.ts'
import { startStreamServer } from '../utils/streamServer.ts'
import type { Args as GenerateArgs } from './generate.ts'

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
  port: {
    type: 'string',
    description: 'Port for stream server. If not specified, an available port is automatically selected.',
    alias: 'p',
  },
  host: {
    type: 'string',
    description: 'Host for stream server',
    default: 'localhost',
  },
  help: {
    type: 'boolean',
    description: 'Show help',
    alias: 'h',
    default: false,
  },
} as const satisfies ArgsDef

export type Args = ParsedArgs<typeof args>

const command = defineCommand({
  meta: {
    name: 'start',
    description: "[input] Start HTTP server with SSE streaming based on a 'kubb.config.ts' file",
  },
  args,
  async run(commandContext) {
    const { args } = commandContext
    const input = args._[0]

    if (args.help) {
      return showUsage(command)
    }

    if (args.debug) {
      args.logLevel = 'debug'
    }

    if (args.verbose) {
      args.logLevel = 'verbose'
    }

    if (args.silent) {
      args.logLevel = 'silent'
    }

    try {
      const result = await getCosmiConfig('kubb', args.config)
      // Create args compatible with getConfigs/startStreamServer (needs watch property)
      const generateArgs = { ...args, watch: false } as unknown as GenerateArgs
      const configs = await getConfigs(result, generateArgs)

      if (configs.length > 1) {
        clack.log.warn(pc.yellow('Stream mode only supports a single configuration. Only the first config will be used.'))
      }

      const port = args.port ? Number.parseInt(args.port, 10) : 0
      const host = args.host

      await startStreamServer({
        port,
        host,
        configPath: result.filepath,
        config: configs[0]!,
        input,
        args: generateArgs,
      })

      // Server is running, don't exit
    } catch (error) {
      clack.log.error(pc.red('Failed to start stream server'))
      console.error(error)
      process.exit(1)
    }
  },
})

export default command
