import path from 'node:path'
import * as process from 'node:process'
import * as clack from '@clack/prompts'
import { type Config, isInputPath, PromiseManager } from '@kubb/core'
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
    const { generate } = await import('../runners/generate.ts')
    const { args } = commandContext
    let config: Config[] | Config

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

    async function start() {
      if (Array.isArray(config)) {
        const promiseManager = new PromiseManager()
        const promises = config.map((c) => () => {
          return generate({
            input,
            config: c,
            args,
          })
        })

        await promiseManager.run('seq', promises)

        return
      }

      await generate({
        input,
        config,
        args,
      })
    }

    async function startWatch() {
      if (Array.isArray(config)) {
        throw new Error('Cannot use watcher with multiple Configs(array)')
      }

      if (isInputPath(config)) {
        return startWatcher([input || config.input.path], async (paths) => {
          await start()

          clack.log.info(pc.yellow(pc.bold(`Watching for changes in ${paths.join(' and ')}`)))
        })
      }
    }

    const logger = createLogger({
      logLevel: LogMapper[args.logLevel as keyof typeof LogMapper] || 3, // 3 is info
    })

    logger.on('start', (message) => {
      clack.intro(message)
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

    await clack.tasks([
      {
        title: 'Loading config',
        task: async () => {
          const result = await getCosmiConfig('kubb', args.config)
          config = await getConfig(result, args)
          await new Promise((resolve) => setTimeout(resolve, 10000))

          return `✓ Config loaded(${pc.dim(path.relative(process.cwd(), result.filepath))})`
        },
      },
      {
        title: 'Starting generation',
        task: async () => {
          await start()

          return '✓ Generation completed'
        },
      },
    ])

    if (args.watch) {
      await startWatch()

      return
    }

    await start()
  },
})

export default command
