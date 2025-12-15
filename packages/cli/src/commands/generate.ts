import path from 'node:path'
import * as process from 'node:process'
import * as clack from '@clack/prompts'
import { isInputPath, type KubbEvents, PromiseManager } from '@kubb/core'
import { LogMapper } from '@kubb/core/logger'
import { AsyncEventEmitter } from '@kubb/core/utils'
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

    const events = new AsyncEventEmitter<KubbEvents>()
    const logLevel = LogMapper[args.logLevel as keyof typeof LogMapper] || 3

    events.emit('lifecycle:start')

    events.emit('group:create', {
      title: 'Configuration started',
      groupId: 'config',
    })

    events.emit('group:start', 'Loading config', 'config')

    const result = await getCosmiConfig('kubb', args.config)
    if (logLevel > LogMapper.silent) {
      events.emit('group:message', `Config loaded from ${pc.dim(path.relative(process.cwd(), result.filepath))}}`, 'config')
    }

    const config = await getConfig(result, args)
    const configs = Array.isArray(config) ? config : [config]

    events.emit('success', '✓ Config loaded successfully')
    events.emit('group:end', 'Configuration completed', 'config')

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

            clack.log.step(pc.yellow(pc.bold(`Watching for changes in ${paths.join(' and ')}`)))
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

    // Write debug logs to filesystem if in debug mode
    if (logLevel >= LogMapper.debug) {
      console.log('⏳ Writing logs')
      // await fsAdapter.writeLogs();
      console.log('✅ Written logs')
    }
  },
})

export default command
