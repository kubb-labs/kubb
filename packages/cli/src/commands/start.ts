import * as process from 'node:process'
import * as clack from '@clack/prompts'
import { LogLevel, type ServerEvents, startServer } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'
import type { ArgsDef } from 'citty'
import { defineCommand, showUsage } from 'citty'
import pc from 'picocolors'
import { version } from '../../package.json'
import { generate } from '../runners/generate.ts'
import { getConfigs } from '../utils/getConfigs.ts'
import { getCosmiConfig } from '../utils/getCosmiConfig.ts'
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
    description: 'Port for the server. If not specified, an available port is automatically selected.',
    alias: 'p',
  },
  host: {
    type: 'string',
    description: 'Host for the server',
    default: 'localhost',
  },
  help: {
    type: 'boolean',
    description: 'Show help',
    alias: 'h',
    default: false,
  },
} as const satisfies ArgsDef

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
      const config = configs[0]!
      const logLevel = LogLevel[args.logLevel as keyof typeof LogLevel] || 3

      const events = new AsyncEventEmitter<ServerEvents>()

      events.on('server:start', (serverUrl: string, configPath: string) => {
        clack.log.success(pc.green(`Stream server started on ${pc.bold(serverUrl)}`))
        clack.log.info(pc.dim(`Config: ${configPath}`))
        clack.log.info(pc.dim(`Connect: ${serverUrl}/api/info`))
        clack.log.info(pc.dim(`Generate: ${serverUrl}/api/generate`))
        clack.log.info(pc.dim(`Health: ${serverUrl}/api/health`))
        clack.log.step(pc.yellow('Waiting for requests... (Press Ctrl+C to stop)'))
      })

      events.on('server:shutdown', () => {
        clack.log.info('Shutting down stream server...')
      })

      events.on('server:stopped', () => {
        clack.log.success('Server stopped')
      })

      await startServer({
        port,
        host,
        configPath: result.filepath,
        config,
        version,
        events,
        onGenerate: async () => {
          await generate({
            input,
            config,
            logLevel,
            events,
          })
        },
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
