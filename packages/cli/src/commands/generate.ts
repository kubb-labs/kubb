import { defineCommand, showUsage } from 'citty'
import type { ArgsDef, ParsedArgs } from 'citty'
import { colors } from 'consola/utils'

import { getConfig } from '../utils/getConfig.ts'
import { getCosmiConfig } from '../utils/getCosmiConfig.ts'
import { startWatcher } from '../utils/watcher.ts'

import path from 'node:path'
import * as process from 'node:process'
import { PromiseManager, isInputPath } from '@kubb/core'
import { LogMapper, createLogger } from '@kubb/core/logger'
import { generate } from '../generate.ts'

declare global {
  var isDevtoolsEnabled: any
}

const args = {
  config: {
    type: 'string',
    description: 'Path to the Kubb config',
    alias: 'c',
  },
  logLevel: {
    type: 'string',
    description: 'Info, silent or debug',
    alias: 'l',
    default: 'info',
    valueHint: 'silent|info|debug',
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
  ui: {
    type: 'boolean',
    description: 'Open ui',
    alias: 'u',
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

    if (args.help) {
      showUsage(command)
      return
    }

    if (args.debug) {
      args.logLevel = 'debug'
    }

    const logLevel = LogMapper[args.logLevel as keyof typeof LogMapper] || 3
    const logger = createLogger({
      logLevel,
    })

    logger.emit('start', 'Loading config')

    const result = await getCosmiConfig('kubb', args.config)
    logger.emit('success', `Config loaded(${colors.dim(path.relative(process.cwd(), result.filepath))})`)

    const config = await getConfig(result, args)

    if (args.watch) {
      if (Array.isArray(config)) {
        throw new Error('Cannot use watcher with multiple Configs(array)')
      }

      if (isInputPath(config)) {
        return startWatcher([input || config.input.path], async (paths) => {
          await generate({ config, args, input })
          logger.emit('start', colors.yellow(colors.bold(`Watching for changes in ${paths.join(' and ')}`)))
        })
      }
    }

    if (Array.isArray(config)) {
      const promiseManager = new PromiseManager()
      const promises = config.map((item) => () => generate({ input, config: item, args }))

      return promiseManager.run('seq', promises)
    }

    await generate({ input, config, args })

    if (globalThis.isDevtoolsEnabled) {
      const restart = await logger.consola?.prompt('Restart(could be used to validate the profiler)?', {
        type: 'confirm',
        initial: false,
      })

      if (restart) {
        await command.run?.(commandContext)
      } else {
        process.exit(1)
      }
    }
  },
})

export default command
