import path from 'node:path'
import * as process from 'node:process'
import * as clack from '@clack/prompts'
import { isInputPath, type KubbEvents, LogLevel, PromiseManager } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'
import type { ArgsDef, ParsedArgs } from 'citty'
import { defineCommand, showUsage } from 'citty'
import { execa } from 'execa'
import pc from 'picocolors'
import { setupLogger } from '../loggers/utils.ts'
import { getConfig } from '../utils/getConfig.ts'
import { getCosmiConfig } from '../utils/getCosmiConfig.ts'
import { ClackWritable } from '../utils/Writables.ts'
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

    if (args.help) {
      return showUsage(command)
    }

    const input = args._[0]
    const promiseManager = new PromiseManager()
    const events = new AsyncEventEmitter<KubbEvents>()
    const { generate } = await import('../runners/generate.ts')

    if (args.debug) {
      args.logLevel = 'debug'
    }

    if (args.verbose) {
      args.logLevel = 'verbose'
    }

    const logLevel = LogLevel[args.logLevel as keyof typeof LogLevel] || 3

    const cleanup = await setupLogger(events, { logLevel })

    await events.emit('lifecycle:start')

    // TODO move to the clack logger
    events.on('hook:execute', async (command, args, cb) => {
      const logger = clack.taskLog({
        title: ['Executing hook', logLevel !== LogLevel.silent ? pc.dim(`${command} ${args.join(' ')}`) : undefined].filter(Boolean).join(' '),
      })

      const writable = new ClackWritable(logger)

      const result = await execa(command, args, {
        detached: true,
        stdout: logLevel === LogLevel.silent ? undefined : ['pipe', writable],
        stripFinalNewline: true,
      })

      cb(result)
    })

    await events.emit('config:start')

    const result = await getCosmiConfig('kubb', args.config)
    await events.emit('info', `Config loaded from ${pc.dim(path.relative(process.cwd(), result.filepath))}}`)

    const config = await getConfig(result, args)
    const configs = Array.isArray(config) ? config : [config]

    await events.emit('success', 'Config loaded successfully')
    await events.emit('config:end')

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

    // Call cleanup before lifecycle:end to properly clean up resources
    if (cleanup) {
      await cleanup()
    }

    await events.emit('lifecycle:end')
  },
})

export default command
