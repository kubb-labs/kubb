import { build, createLogger, LogLevel, ParallelPluginError, PluginError, SummaryError } from '@kubb/core'
import { randomPicoColour } from '@kubb/core'

import { execa } from 'execa'
import pc from 'picocolors'
import { parseArgsStringToArgv } from 'string-argv'

import { getSummary } from './utils/getSummary.ts'
import { OraWritable } from './utils/OraWritable.ts'
import { spinner } from './utils/spinner.ts'

import type { Writable } from 'node:stream'
import type { CLIOptions, KubbConfig } from '@kubb/core'
import type { ExecaReturnValue } from 'execa'

type GenerateProps = {
  input?: string
  config: KubbConfig
  CLIOptions: CLIOptions
}

type ExecutingHooksProps = {
  hooks: KubbConfig['hooks']
  logLevel: LogLevel
}

type Executer = { subProcess: ExecaReturnValue<string>; abort: AbortController['abort'] }

async function executeHooks({ hooks, logLevel }: ExecutingHooksProps): Promise<void> {
  if (!hooks?.done) {
    return
  }

  const commands = Array.isArray(hooks.done) ? hooks.done : [hooks.done]

  if (logLevel === LogLevel.silent) {
    spinner.start(`Executing hooks`)
  }

  const executers: Promise<Executer | null>[] = commands
    .map(async (command) => {
      const oraWritable = new OraWritable(spinner, command)
      const abortController = new AbortController()
      const [cmd, ..._args] = [...parseArgsStringToArgv(command)]

      if (!cmd) {
        return null
      }

      spinner.start(`Executing hook ${logLevel !== 'silent' ? pc.dim(command) : ''}`)

      const subProcess = await execa(cmd, _args, { detached: true, signal: abortController.signal }).pipeStdout!(oraWritable as Writable)
      spinner.suffixText = ''

      if (logLevel === LogLevel.silent) {
        spinner.succeed(`Executing hook ${logLevel !== 'silent' ? pc.dim(command) : ''}`)

        console.log(subProcess.stdout)
      }

      oraWritable.destroy()
      return { subProcess, abort: abortController.abort.bind(abortController) }
    })
    .filter(Boolean)

  await Promise.all(executers)

  if (logLevel === LogLevel.silent) {
    spinner.succeed(`Executing hooks`)
  }
}

export async function generate({ input, config, CLIOptions }: GenerateProps): Promise<void> {
  const logger = createLogger({ logLevel: CLIOptions.logLevel || LogLevel.silent, name: config.name, spinner })

  if (config.name) {
    spinner.prefixText = randomPicoColour(config.name)
  }

  const hrstart = process.hrtime()

  if (CLIOptions.logLevel === LogLevel.debug) {
    const { performance, PerformanceObserver } = await import('node:perf_hooks')

    const performanceOpserver = new PerformanceObserver((items) => {
      const message = `${items.getEntries()[0]?.duration.toFixed(0)}ms`

      spinner.suffixText = pc.yellow(message)

      performance.clearMarks()
    })

    performanceOpserver.observe({ type: 'measure' })
  }

  try {
    const { root: _root, ...userConfig } = config
    const logLevel = logger.logLevel
    const inputPath = input ?? ('path' in userConfig.input ? userConfig.input.path : undefined)

    spinner.start(`🚀 Building ${logLevel !== 'silent' ? pc.dim(inputPath) : ''}`)

    const output = await build({
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

    await executeHooks({ hooks: config.hooks, logLevel })

    spinner.suffixText = ''
    spinner.succeed(`🚀 Build completed ${logLevel !== 'silent' ? pc.dim(inputPath) : ''}`)

    const summary = getSummary({ pluginManager: output.pluginManager, config, status: 'success', hrstart, logLevel: CLIOptions.logLevel })
    console.log(summary.join(''))
  } catch (error) {
    let summary: string[] = []

    if (error instanceof PluginError || error instanceof ParallelPluginError) {
      summary = getSummary({ pluginManager: error.pluginManager, config, status: 'failed', hrstart, logLevel: CLIOptions.logLevel })
    }

    throw new SummaryError('Something went wrong\n', { cause: error as Error, summary })
  }
}
