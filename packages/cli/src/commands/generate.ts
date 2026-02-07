import path from 'node:path'
import * as process from 'node:process'
import * as clack from '@clack/prompts'
import { isInputPath, type KubbEvents, LogLevel, PromiseManager } from '@kubb/core'
import { AsyncEventEmitter, executeIfOnline } from '@kubb/core/utils'
import type { ArgsDef, ParsedArgs } from 'citty'
import { defineCommand, showUsage } from 'citty'
import getLatestVersion from 'latest-version'
import pc from 'picocolors'
import { lt } from 'semver'
import { version } from '../../package.json'
import { setupLogger } from '../loggers/utils.ts'
import { generate } from '../runners/generate.ts'
import { getConfigs } from '../utils/getConfigs.ts'
import { getCosmiConfig } from '../utils/getCosmiConfig.ts'
import { startStreamServer } from '../utils/streamServer.ts'
import { startWatcher } from '../utils/watcher.ts'

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
  stream: {
    type: 'boolean',
    description: 'Start HTTP server with SSE streaming',
    default: false,
  },
  port: {
    type: 'string',
    description: 'Port for stream server (requires --stream). If not specified, an available port is automatically selected.',
    alias: 'p',
  },
  host: {
    type: 'string',
    description: 'Host for stream server (requires --stream)',
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
    name: 'generate',
    description: "[input] Generate files based on a 'kubb.config.ts' file",
  },
  args,
  async run(commandContext) {
    const { args } = commandContext
    const input = args._[0]
    const events = new AsyncEventEmitter<KubbEvents>()
    const promiseManager = new PromiseManager()

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

    const logLevel = LogLevel[args.logLevel as keyof typeof LogLevel] || 3

    await setupLogger(events, { logLevel })

    await executeIfOnline(async () => {
      const latestVersion = await getLatestVersion('@kubb/cli')

      if (lt(version, latestVersion)) {
        await events.emit('version:new', version, latestVersion)
      }
    })

    try {
      const result = await getCosmiConfig('kubb', args.config)
      const configs = await getConfigs(result, args)

      // Start stream server if --stream flag is provided
      if (args.stream) {
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
          args,
        })

        // Server is running, don't exit
        return
      }

      await events.emit('config:start')

      await events.emit('info', 'Config loaded', path.relative(process.cwd(), result.filepath))

      await events.emit('success', 'Config loaded successfully', path.relative(process.cwd(), result.filepath))
      await events.emit('config:end', configs)

      await events.emit('lifecycle:start', version)

      const promises = configs.map((config) => {
        return async () => {
          if (isInputPath(config) && args.watch) {
            await startWatcher([input || config.input.path], async (paths) => {
              await generate({
                input,
                config,
                logLevel,
                events,
              })

              clack.log.step(pc.yellow(`Watching for changes in ${paths.join(' and ')}`))
            })

            return
          }

          await generate({
            input,
            config,
            logLevel,
            events,
          })
        }
      })

      await promiseManager.run('seq', promises)

      await events.emit('lifecycle:end')
    } catch (error) {
      await events.emit('error', error as Error)
      process.exit(1)
    }
  },
})

export default command
