import pathParser from 'node:path'

import { build, throttle, ParallelPluginError, PluginError } from '@kubb/core'

import { execa } from 'execa'
import pc from 'picocolors'
import PrettyError from 'pretty-error'
import { parseArgsStringToArgv } from 'string-argv'

import { parseHrtimeToSeconds } from './utils/parseHrtimeToSeconds.ts'
import { parseText } from './utils/parseText.ts'

import type { BuildOutput, CLIOptions, KubbConfig, Logger, LogLevel } from '@kubb/core'
import type { Ora } from 'ora'
import { OraWritable } from './utils/OraWritable.ts'

type RunProps = {
  config: KubbConfig
  spinner: Ora
  options: CLIOptions
}

export async function run({ config, options, spinner }: RunProps): Promise<void> {
  const hrstart = process.hrtime()
  const [log] = throttle<void, Parameters<Logger['log']>>((message, { logLevel, params }) => {
    if (logLevel === 'error') {
      spinner.fail(pc.red(`${message}\n\n` || `Something went wrong\n\n`))
    } else if (logLevel === 'info') {
      if (message) {
        spinner.text = message
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        spinner.text = `🪂 Executing ${params?.hookName || 'unknown'}(${pc.yellow(params?.pluginName || 'unknown')})`
      }
    }
  }, 100)
  const logger: Logger = {
    log,
    spinner,
  }

  const onDone = async (hooks: KubbConfig['hooks'], logLevel: LogLevel) => {
    if (!hooks?.done) {
      return
    }

    let commands: string[] = []
    if (typeof hooks?.done === 'string') {
      commands = [hooks.done]
    } else {
      commands = hooks.done
    }

    const promises = commands.map(async (command) => {
      const oraWritable = new OraWritable(spinner, command)
      const [cmd, ..._args] = [...parseArgsStringToArgv(command)]
      spinner.start(parseText(`🪂 Executing hooks(${pc.yellow('done')})`, { info: ` ${pc.dim(command)}` }, logLevel))

      const { stdout } = await execa(cmd, _args, {}).pipeStdout!(oraWritable)
      spinner.suffixText = ''
      oraWritable.destroy()

      if (logLevel === 'info') {
        spinner.succeed(parseText(`🪂 Executing hooks(${pc.yellow('done')})`, { info: ` ${pc.dim(command)}` }, logLevel))

        console.log(stdout)
      }
    })

    await Promise.all(promises)

    if (logLevel === 'silent') {
      spinner.succeed(parseText(`🪂 Executing hooks(${pc.yellow('done')})`, {}, logLevel))
    }
  }

  const printSummary = (pluginManager: BuildOutput['pluginManager'], status: 'success' | 'failed') => {
    const elapsedSeconds = parseHrtimeToSeconds(process.hrtime(hrstart))

    const buildStartPlugins = [
      ...new Set(pluginManager.executed.filter((item) => item.hookName === 'buildStart' && item.plugin.name !== 'core').map((item) => item.plugin.name)),
    ]
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
          : `${pc.red(`${pluginsCount - buildStartPlugins.length} failed`)}, ${pluginsCount} total`,
      filesCreated: files.length,
      time: pc.yellow(`${elapsedSeconds}s`),
      output: pathParser.resolve(config.root, config.output.path),
    } as const

    console.log(`
  ${pc.bold('Plugins:')}      ${meta.plugins}
${pc.bold('Generated:')}      ${meta.filesCreated} files
     ${pc.bold('Time:')}      ${meta.time}
   ${pc.bold('Output:')}      ${meta.output}
     `)

    if (options.debug) {
      console.log(`${pc.bold('Generated files:')}`)
      console.log(`${files.map((file) => `${pc.blue(file.meta?.pluginName)} ${file.path}`).join('\n')}`)
    }
  }

  const printErrors = (error: Error) => {
    const pe = new PrettyError()

    if (options.debug) {
      spinner.fail(pc.red(`Something went wrong\n\n`))
      const causedError = error?.cause as Error

      console.log(pe.render(error))

      if (causedError) {
        console.log(pe.render(causedError))
      }
    } else {
      spinner.fail(pc.red(`Something went wrong\n\n${error?.message}`))
    }
  }

  try {
    const { root, ...userConfig } = config
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

    await onDone(config.hooks, logLevel)

    printSummary(output.pluginManager, 'success')
  } catch (error: any) {
    if (error instanceof ParallelPluginError) {
      error.errors.map((e) => printErrors(e))
    } else {
      printErrors(error as Error)
    }

    if (error instanceof PluginError || error instanceof ParallelPluginError) {
      printSummary(error.pluginManager, 'failed')
    }

    throw error
  }
}
