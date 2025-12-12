import path from 'node:path'
import * as process from 'node:process'
import * as clack from '@clack/prompts'
import { isInputPath, PromiseManager } from '@kubb/core'
import { createLogger, LogMapper } from '@kubb/core/logger'
import type { ArgsDef, ParsedArgs } from 'citty'
import { defineCommand, showUsage } from 'citty'
import pc from 'picocolors'
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

    logger.on('start', (message) => {
      clack.intro(message)
    })

    logger.on('stop', (message) => {
      clack.outro(message)
    })

    logger.on('step', (message) => {
      clack.log.step(message)
    })

    logger.on('success', (message) => {
      clack.log.success(message)
    })

    logger.on('warning', (message) => {
      if (logger.logLevel >= LogMapper.warn) {
        clack.log.warning(pc.yellow(message))
      }
    })

    logger.on('info', (message) => {
      if (logger.logLevel >= LogMapper.info) {
        clack.log.info(pc.yellow(message))
      }
    })

    logger.on('verbose', (message) => {
      if (logger.logLevel >= LogMapper.verbose) {
        const formattedLogs = message.logs.join('\n')
        clack.log.message(pc.dim(formattedLogs))
      }
    })

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
  },
})

export default command
