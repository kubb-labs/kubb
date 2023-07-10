import { build, ParallelPluginError, PluginError, SummaryError, timeout, createLogger, LogLevel } from '@kubb/core'

import type { ExecaReturnValue } from 'execa'

import { execa } from 'execa'
import pc from 'picocolors'
import { parseArgsStringToArgv } from 'string-argv'

import type { CLIOptions, KubbConfig, LogLevels } from '@kubb/core'
import { OraWritable } from './utils/OraWritable.ts'
import { spinner } from './utils/spinner.ts'
import { getSummary } from './utils/getSummary.ts'

type GenerateProps = {
  input?: string
  config: KubbConfig
  CLIOptions: CLIOptions
}

type ExecutingHooksProps = {
  hooks: KubbConfig['hooks']
  logLevel: LogLevels
}

async function executeHooks({ hooks, logLevel }: ExecutingHooksProps): Promise<void> {
  if (!hooks?.done) {
    return
  }

  const commands = Array.isArray(hooks.done) ? hooks.done : [hooks.done]

  if (logLevel === LogLevel.silent) {
    spinner.start(`Executing hooks`)
  }
  type Executer = { subProcess: ExecaReturnValue<string>; abort: AbortController['abort'] }

  const executers: Promise<Executer>[] = commands.map(async (command) => {
    const oraWritable = new OraWritable(spinner, command)
    const abortController = new AbortController()
    const [cmd, ..._args] = [...parseArgsStringToArgv(command)]

    spinner.start(`Executing hook ${logLevel !== 'silent' ? pc.dim(command) : ''}`)

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const subProcess = await execa(cmd, _args, { detached: true, signal: abortController.signal }).pipeStdout!(oraWritable)
    spinner.suffixText = ''

    if (logLevel === LogLevel.silent) {
      spinner.succeed(`Executing hook ${logLevel !== 'silent' ? pc.dim(command) : ''}`)

      console.log(subProcess.stdout)
    }

    // wait for 100ms to be sure that all open files are close(fs)
    await timeout(100)

    oraWritable.destroy()
    return { subProcess, abort: abortController.abort.bind(abortController) }
  })

  await Promise.all(executers)

  if (logLevel === LogLevel.silent) {
    spinner.succeed(`Executing hooks`)
  }
}

export default async function generate({ input, config, CLIOptions }: GenerateProps): Promise<void> {
  const hrstart = process.hrtime()
  const logger = createLogger(spinner)

  if (CLIOptions.logLevel === LogLevel.debug) {
    const { performance, PerformanceObserver } = await import('node:perf_hooks')

    const performanceOpserver = new PerformanceObserver((items) => {
      const message = `${items.getEntries()[0].duration.toFixed(0)}ms`

      spinner.suffixText = pc.yellow(message)

      performance.clearMarks()
    })

    performanceOpserver.observe({ type: 'measure' })
  }

  try {
    const { root: _root, ...userConfig } = config
    const logLevel = CLIOptions.logLevel ?? LogLevel.silent
    const inputPath = input ?? userConfig.input.path

    spinner.start(`🚀 Building ${logLevel !== 'silent' ? pc.dim(inputPath) : ''}`)

    const output = await build({
      config: {
        root: process.cwd(),
        ...userConfig,
        input: {
          ...userConfig.input,
          path: inputPath,
        },
        output: {
          write: true,
          ...userConfig.output,
        },
      },
      logger,
    })

    spinner.suffixText = ''
    spinner.succeed(`🚀 Build completed ${logLevel !== 'silent' ? pc.dim(inputPath) : ''}`)

    await executeHooks({ hooks: config.hooks, logLevel })

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
