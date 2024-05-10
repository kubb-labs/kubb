import { LogLevel } from '@kubb/core/logger'
import { defineCommand, showUsage } from 'citty'
import type { ArgsDef, ParsedArgs } from 'citty'
import { execa } from 'execa'
import c from 'tinyrainbow'

import path from 'node:path'
import { getConfig } from '../utils/getConfig.ts'
import { getCosmiConfig } from '../utils/getCosmiConfig.ts'
import { spinner } from '../utils/spinner.ts'
import { startWatcher } from '../utils/watcher.ts'

import { PromiseManager, isInputPath } from '@kubb/core'
import { generate } from '../generate.ts'

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
    default: LogLevel.info,
    valueHint: `${LogLevel.silent}|${LogLevel.info}|${LogLevel.debug}`,
  },
  watch: {
    type: 'boolean',
    description: 'Watch mode based on the input file',
    alias: 'w',
    default: false,
  },
  bun: {
    type: 'boolean',
    description: 'Run Kubb with Bun',
    alias: 'b',
    default: false,
  },
  debug: {
    type: 'boolean',
    description: 'Override logLevel to debug',
    alias: 'd',
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
  setup() {
    spinner.start('🔍 Loading config')
  },
  async run({ args }) {
    const input = args._[0]

    if (args.help) {
      showUsage(command)
      return
    }

    if (args.debug) {
      args.logLevel = LogLevel.debug
    }

    if (args.bun) {
      const command = process.argv.splice(2).filter((item) => item !== '--bun')

      await execa('bkubb', command, { stdout: process.stdout, stderr: process.stderr })
      return
    }

    const result = await getCosmiConfig('kubb', args.config)
    spinner.succeed(`🔍 Config loaded(${c.dim(path.relative(process.cwd(), result.filepath))})`)

    const config = await getConfig(result, args)

    if (args.watch) {
      if (Array.isArray(config)) {
        throw new Error('Cannot use watcher with multiple Configs(array)')
      }

      if (isInputPath(config)) {
        return startWatcher([input || config.input.path], async (paths) => {
          await generate({ config, args })
          spinner.spinner = 'simpleDotsScrolling'
          spinner.start(c.yellow(c.bold(`Watching for changes in ${paths.join(' and ')}`)))
        })
      }
    }

    if (Array.isArray(config)) {
      const promiseManager = new PromiseManager()
      const promises = config.map((item) => () => generate({ input, config: item, args }))

      return promiseManager.run('seq', promises)
    }

    await generate({ input, config, args })
  },
})

export default command
