import { safeBuild } from '@kubb/core'
import { createLogger, LogLevel, randomCliColour } from '@kubb/core/logger'

import { execa } from 'execa'
import { parseArgsStringToArgv } from 'string-argv'
import c from 'tinyrainbow'

import { getSummary } from './utils/getSummary.ts'
import { OraWritable } from './utils/OraWritable.ts'
import { spinner } from './utils/spinner.ts'

import type { Writable } from 'node:stream'
import type { CLIOptions, Config } from '@kubb/core'
import type { ExecaReturnValue } from 'execa'

type GenerateProps = {
  input?: string
  config: Config
  CLIOptions: CLIOptions
}

type ExecutingHooksProps = {
  hooks: Config['hooks']
  logLevel: LogLevel
}

type Executer = {
  subProcess: ExecaReturnValue<string>
  abort: AbortController['abort']
}

async function executeHooks({ hooks, logLevel }: ExecutingHooksProps): Promise<void> {
  if (!hooks?.done) {
    return
  }

  const commands = Array.isArray(hooks.done) ? hooks.done : [hooks.done]

  if (logLevel === LogLevel.silent) {
    spinner.start('Executing hooks')
  }

  const executers: Promise<Executer | null>[] = commands
    .map(async (command) => {
      const oraWritable = new OraWritable(spinner, command)
      const abortController = new AbortController()
      const [cmd, ..._args] = [...parseArgsStringToArgv(command)]

      if (!cmd) {
        return null
      }

      spinner.start(`Executing hook ${logLevel !== 'silent' ? c.dim(command) : ''}`)

      const subProcess = await execa(cmd, _args, {
        detached: true,
        signal: abortController.signal,
      }).pipeStdout?.(oraWritable as Writable)
      spinner.suffixText = ''

      if (logLevel === LogLevel.silent) {
        spinner.succeed(`Executing hook ${logLevel !== 'silent' ? c.dim(command) : ''}`)

        console.log(subProcess.stdout)
      }

      oraWritable.destroy()
      return { subProcess, abort: abortController.abort.bind(abortController) }
    })
    .filter(Boolean)

  await Promise.all(executers)

  if (logLevel === LogLevel.silent) {
    spinner.succeed('Executing hooks')
  }
}

export async function generate({ input, config, CLIOptions }: GenerateProps): Promise<void> {
  const logger = createLogger({
    logLevel: CLIOptions.logLevel || LogLevel.silent,
    name: config.name,
    spinner,
  })

  if (logger.name) {
    spinner.prefixText = randomCliColour(logger.name)
  }

  const hrstart = process.hrtime()

  if (CLIOptions.logLevel === LogLevel.debug) {
    const { performance, PerformanceObserver } = await import('node:perf_hooks')

    const performanceOpserver = new PerformanceObserver((items) => {
      const message = `${items.getEntries()[0]?.duration.toFixed(0)}ms`

      spinner.suffixText = c.yellow(message)

      performance.clearMarks()
    })

    performanceOpserver.observe({ type: 'measure' })
  }

  const { root: _root, ...userConfig } = config
  const logLevel = logger.logLevel
  const inputPath = input ?? ('path' in userConfig.input ? userConfig.input.path : undefined)

  spinner.start(`🚀 Building ${logLevel !== 'silent' ? c.dim(inputPath) : ''}`)

  const { pluginManager, error } = await safeBuild({
    config: {
      root: process.cwd(),
      ...userConfig,
      input: inputPath
        ? {
            ...userConfig.input,
            path: inputPath,
          }
        : userConfig.input,
      output: {
        write: true,
        ...userConfig.output,
      },
    },
    logger,
  })

  const summary = getSummary({
    pluginManager,
    config,
    status: error ? 'failed' : 'success',
    hrstart,
    logger,
  })

  if (error) {
    spinner.suffixText = ''
    spinner.fail(`🚀 Build failed ${logLevel !== 'silent' ? c.dim(inputPath) : ''}`)

    console.log(summary.join(''))

    throw error
  }

  await executeHooks({ hooks: config.hooks, logLevel })

  spinner.suffixText = ''
  spinner.succeed(`🚀 Build completed ${logLevel !== 'silent' ? c.dim(inputPath) : ''}`)

  console.log(summary.join(''))
}
