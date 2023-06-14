import pathParser from 'node:path'

import { build, ParallelPluginError, PluginError, SummaryError, timeout, createLogger } from '@kubb/core'

import type { ExecaReturnValue } from 'execa'
import { execa } from 'execa'
import pc from 'picocolors'

import { parseArgsStringToArgv } from 'string-argv'

import { parseHrtimeToSeconds } from './utils/parseHrtimeToSeconds.ts'
import { parseText } from './utils/parseText.ts'

import type { BuildOutput, CLIOptions, KubbConfig, LogLevel } from '@kubb/core'
import { OraWritable } from './utils/OraWritable.ts'
import { spinner } from './program.ts'

type RunProps = {
  config: KubbConfig
  options: CLIOptions
}

export async function run({ config, options }: RunProps): Promise<void> {
  const hrstart = process.hrtime()

  const logger = createLogger(spinner)

  const executeHooks = async (hooks: KubbConfig['hooks'], logLevel: LogLevel) => {
    if (!hooks?.done) {
      return
    }

    const commands = Array.isArray(hooks.done) ? hooks.done : [hooks.done]

    if (logLevel === 'silent') {
      spinner.start(`🪂 Executing hooks`)
    }
    type Executer = { subProcess: ExecaReturnValue<string>; abort: AbortController['abort'] }

    const executers: Promise<Executer>[] = commands.map(async (command) => {
      const oraWritable = new OraWritable(spinner, command)
      const abortController = new AbortController()
      const [cmd, ..._args] = [...parseArgsStringToArgv(command)]

      spinner.start(parseText(`🪂 Executing hook`, { info: ` ${pc.dim(command)}` }, logLevel))

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const subProcess = await execa(cmd, _args, { detached: true, signal: abortController.signal }).pipeStdout!(oraWritable)
      spinner.suffixText = ''

      if (logLevel === 'info') {
        spinner.succeed(parseText(`🪂 Executing hook`, { info: ` ${pc.dim(command)}` }, logLevel))

        console.log(subProcess.stdout)
      }

      // wait for 50ms to be sure that all open files are close(fs)
      await timeout(50)

      oraWritable.destroy()
      return { subProcess, abort: abortController.abort.bind(abortController) }
    })

    await Promise.all(executers)

    if (logLevel === 'silent') {
      spinner.succeed(`🪂 Executing hooks`)
    }
  }

  const getSummary = (pluginManager: BuildOutput['pluginManager'], status: 'success' | 'failed'): string[] => {
    const logs: string[] = []
    const elapsedSeconds = parseHrtimeToSeconds(process.hrtime(hrstart))

    const buildStartPlugins = [
      ...new Set(pluginManager.executed.filter((item) => item.hookName === 'buildStart' && item.plugin.name !== 'core').map((item) => item.plugin.name)),
    ]

    const failedPlugins = config.plugins?.filter((plugin) => !buildStartPlugins.includes(plugin.name))?.map((plugin) => plugin.name)
    const pluginsCount = config.plugins?.length || 0
    const files = pluginManager.fileManager.files.sort((a, b) => {
      if (!a.meta?.pluginName || !b.meta?.pluginName) {
        return 0
      }
      if (a.meta?.pluginName.length < b.meta?.pluginName.length) {
        return 1
      }
      if (a.meta?.pluginName.length > b.meta?.pluginName.length) {
        return -1
      }
      return 0
    })

    const meta = {
      plugins:
        status === 'success'
          ? `${pc.green(`${buildStartPlugins.length} successful`)}, ${pluginsCount} total`
          : `${pc.red(`${failedPlugins?.length || 0} failed`)}, ${pluginsCount} total`,
      pluginsFailed: status === 'failed' ? failedPlugins?.join(', ') : undefined,
      filesCreated: files.length,
      time: pc.yellow(`${elapsedSeconds}s`),
      output: pathParser.resolve(config.root, config.output.path),
    } as const

    if (options.debug) {
      logs.push(pc.bold('Generated files:\n'))
      logs.push(files.map((file) => `${pc.blue(file.meta?.pluginName)} ${file.path}`).join('\n'))
    }

    logs.push(
      [
        [`  ${pc.bold('Plugins:')}      ${meta.plugins}`, true],
        [`   ${pc.dim('Failed:')}      ${meta.pluginsFailed || 'none'}`, !!meta.pluginsFailed],
        [`${pc.bold('Generated:')}      ${meta.filesCreated} files`, true],
        [`     ${pc.bold('Time:')}      ${meta.time}`, true],
        [`   ${pc.bold('Output:')}      ${meta.output}`, true],
        [`\n`, true],
      ]
        .map((item) => {
          if (item.at(1)) {
            return item.at(0)
          }
          return undefined
        })
        .filter(Boolean)
        .join('\n')
    )

    return logs
  }

  try {
    const { root: _root, ...userConfig } = config
    const logLevel = options.logLevel ?? userConfig.logLevel ?? 'silent'
    const inputPath = options.input ?? userConfig.input.path

    spinner.start(parseText(`🚀 Building`, { info: `(${pc.dim(inputPath)})` }, logLevel))

    const output = await build({
      config: {
        root: process.cwd(),
        ...userConfig,
        logLevel,
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

    spinner.succeed(parseText(`🚀 Build completed`, { info: `(${pc.dim(inputPath)})` }, logLevel))

    await executeHooks(config.hooks, logLevel)

    const summary = getSummary(output.pluginManager, 'success')
    console.log(summary.join(''))
  } catch (error: any) {
    if (error instanceof PluginError || error instanceof ParallelPluginError) {
      const summary = getSummary(error.pluginManager, 'failed')

      throw new SummaryError('Something went wrong\n', { cause: error, summary })
    }

    throw new SummaryError('Something went wrong\n', { cause: error })
  }
}
