import path from 'node:path'
import * as process from 'node:process'
import * as clack from '@clack/prompts'
import { isInputPath, PromiseManager } from '@kubb/core'
import { createLogger, LogMapper } from '@kubb/core/logger'
import type { ArgsDef, ParsedArgs } from 'citty'
import { defineCommand, showUsage } from 'citty'
import pc from 'picocolors'
import { LoggerAdapterFactory } from '../utils/adapters/index.ts'
import { getConfig } from '../utils/getConfig.ts'
import { getCosmiConfig } from '../utils/getCosmiConfig.ts'
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
    const promiseManager = new PromiseManager()
    const { generate } = await import('../runners/generate.ts')

    if (args.help) {
      return showUsage(command)
    }

    if (args.debug) {
      args.logLevel = 'debug'
    }

    if (args.verbose) {
      args.logLevel = 'verbose'
    }

    const logger = createLogger({
      logLevel: LogMapper[args.logLevel as keyof typeof LogMapper] || 3, // 3 is info
    })

    // Create and setup logger adapter based on environment
    const adapter = LoggerAdapterFactory.createAuto({
      logLevel: logger.logLevel,
    })
    adapter.setup(logger)

    logger.emit('start', 'Configuration started')

    const configLogger = clack.taskLog({
      title: 'Loading config',
    })

    const result = await getCosmiConfig('kubb', args.config)
    if (logger.logLevel > LogMapper.silent) {
      configLogger.message(`Config loaded from ${pc.dim(path.relative(process.cwd(), result.filepath))}}`)
    }
    const config = await getConfig(result, args)

    const configs = Array.isArray(config) ? config : [config]

    configLogger.success('✓ Config loaded successfully')
    logger.emit('stop', 'Configuration completed')

    const promises = configs.map((config) => {
      return async () => {
        if (isInputPath(config) && args.watch) {
          await startWatcher([input || config.input.path], async (paths) => {
            await generate({
              input,
              config,
              logger,
            })

            clack.log.step(pc.yellow(pc.bold(`Watching for changes in ${paths.join(' and ')}`)))
          })

          return
        }

        await generate({
          input,
          config,
          logger,
        })
      }
    })

    await promiseManager.run('seq', promises)

    // Cleanup adapter
    adapter.cleanup()
  },
})

export default command
