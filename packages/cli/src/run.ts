/* eslint-disable no-console */
import pathParser from 'node:path'

import pc from 'picocolors'
import { execa } from 'execa'
import { parseArgsStringToArgv } from 'string-argv'
import PrettyError from 'pretty-error'

import { ParallelPluginError, PluginError, build } from '@kubb/core'
import type { Logger, CLIOptions, KubbConfig, BuildOutput } from '@kubb/core'

import { parseHrtimeToSeconds } from './utils/parseHrtimeToSeconds.ts'

import type { Ora } from 'ora'

type RunProps = {
  config: KubbConfig
  spinner: Ora
  options: CLIOptions
}

export async function run({ config, options, spinner }: RunProps): Promise<void> {
  const hrstart = process.hrtime()
  const logger: Logger = {
    log(message, logLevel) {
      if (logLevel === 'error') {
        spinner.fail(message)
      }

      switch (logLevel) {
        case 'error':
          spinner.fail(message)
          break

        default:
          spinner.info(message)
          break
      }
    },
    spinner,
  }

  const onDone = async (hooks: KubbConfig['hooks']) => {
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
      const [cmd, ..._args] = [...parseArgsStringToArgv(command)]
      spinner.start(`🪂 Executing hooks(${pc.yellow('done')}) ${pc.dim(command)}`)
      await execa(cmd, _args)
      spinner.succeed(`🪂 Executed hooks(${pc.yellow('done')}) ${pc.dim(command)}`)
    })

    await Promise.all(promises)
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
      if (a.meta?.pluginName.length < b.meta?.pluginName.length) return 1
      if (a.meta?.pluginName.length > b.meta?.pluginName.length) return -1
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

    if (error instanceof ParallelPluginError) {
      error.errors.map((e) => printErrors(e))

      return
    }

    if (options.debug) {
      spinner.fail(pc.red(`Something went wrong\n\n`))
      const causedError = (error as Error)?.cause as Error

      console.log(pe.render(error))

      if (causedError) {
        console.log(pe.render(causedError))
      }
    } else {
      spinner.fail(pc.red(`Something went wrong\n\n${(error as Error)?.message}`))
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
    const { root, ...userConfig } = config

    spinner.start(`🚀 Building(${pc.dim(options.input ?? userConfig.input.path)})`)

    const output = await build({
      config: {
        root: process.cwd(),
        ...userConfig,
        input: {
          ...userConfig.input,
          path: options.input ?? userConfig.input.path,
        },
        output: {
          write: true,
          ...userConfig.output,
        },
      },
      logger,
    })

    spinner.succeed(`🚀 Build completed(${pc.dim(options.input ?? userConfig.input.path)})`)

    await onDone(config.hooks)

    printSummary(output.pluginManager, 'success')
  } catch (error: any) {
    printErrors(error)

    if (error instanceof PluginError || error instanceof ParallelPluginError) {
      printSummary(error.pluginManager, 'failed')
    }

    throw error
  }
}
