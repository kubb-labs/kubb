import { createServer } from 'node:http'
import path from 'node:path'
import * as process from 'node:process'

import * as clack from '@clack/prompts'
import type { Config, ServerEvents } from '@kubb/core'
import { LogLevel } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import { AsyncEventEmitter as AsyncEventEmitterClass } from '@kubb/core/utils'
import type { ArgsDef } from 'citty'
import { defineCommand, showUsage } from 'citty'
import pc from 'picocolors'
import { version } from '../../package.json'
import { generate } from '../runners/generate.ts'
import { getConfigs } from '../utils/getConfigs.ts'
import { getCosmiConfig } from '../utils/getCosmiConfig.ts'
import type { Args as GenerateArgs } from './generate.ts'

declare global {
  namespace NodeJS {
    interface Global {
      __KUBB_AGENT_CONTEXT__: {
        config: Config
        configPath: string
        version: string
        events: AsyncEventEmitter<ServerEvents>
        onGenerate: () => Promise<void>
      }
    }
  }
}

// Make globalThis accessible with proper typing
declare const globalThis: {
  __KUBB_AGENT_CONTEXT__?: {
    config: Config
    configPath: string
    version: string
    events: AsyncEventEmitter<ServerEvents>
    onGenerate: () => Promise<void>
  }
} & typeof global

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

async function startServer(
  port: number,
  host: string,
  configPath: string,
  config: Config,
  events: AsyncEventEmitter<ServerEvents>,
  onGenerate: () => Promise<void>,
): Promise<void> {
  try {
    // Set up agent context via global before importing Nitro
    // This will be accessed by the routes
    globalThis.__KUBB_AGENT_CONTEXT__ = {
      config,
      configPath,
      version,
      events,
      onGenerate,
    }

    let listener: any
    try {
      const mod = await import('@kubb/agent')
      listener = await mod.getListener()
    } catch (error) {
      console.error('Failed to load pre-built Nitro server.')
      console.error('Please ensure @kubb/agent is built by running: pnpm install')
      throw error
    }

    // Create HTTP server with the Nitro listener
    const server = createServer(listener)

    // Start listening
    server.listen(port, host, () => {
      const address = server.address()
      const actualPort = typeof address === 'object' && address ? address.port : port
      const serverUrl = `http://${host}:${actualPort}`

      events.emit('server:start', serverUrl, path.relative(process.cwd(), configPath))
    })
  } catch (error) {
    console.error('Failed to start agent server:', error)
    process.exit(1)
  }
}

const command = defineCommand({
  meta: {
    name: 'agent',
    description: '[input] Start Agent server with code generation capabilities based on a kubb.config.ts file',
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
      // Create args compatible with getConfigs/startServer (needs watch property)
      const generateArgs = { ...args, watch: false } as unknown as GenerateArgs
      const configs = await getConfigs(result, generateArgs)

      if (configs.length > 1) {
        clack.log.warn(pc.yellow('Agent server only supports a single configuration. Only the first config will be used.'))
      }

      const port = args.port ? Number.parseInt(args.port, 10) : 0
      const host = args.host
      const config = configs[0]!
      const logLevel = LogLevel[args.logLevel as keyof typeof LogLevel] || 3

      const events = new AsyncEventEmitterClass<ServerEvents>()

      events.on('server:start', (serverUrl: string, configPath: string) => {
        clack.log.success(pc.green(`Agent server started on ${pc.bold(serverUrl)}`))
        clack.log.info(pc.dim(`Config: ${configPath}`))
        clack.log.info(pc.dim(`Health: ${serverUrl}/api/health`))
        clack.log.info(pc.dim(`Info: ${serverUrl}/api/info`))
        clack.log.info(pc.dim(`Generate: ${serverUrl}/api/generate`))
        clack.log.step(pc.yellow('Waiting for requests... (Press Ctrl+C to stop)'))
      })

      events.on('server:shutdown', () => {
        clack.log.info('Shutting down agent server...')
      })

      events.on('server:stopped', () => {
        clack.log.success('Agent server stopped')
      })

      await startServer(port, host, result.filepath, config, events, async () => {
        await generate({
          input,
          config,
          logLevel,
          events,
        })
      })

      // Server is running, don't exit
    } catch (error) {
      clack.log.error(pc.red('Failed to start agent server'))
      console.error(error)
      process.exit(1)
    }
  },
})

export default command
