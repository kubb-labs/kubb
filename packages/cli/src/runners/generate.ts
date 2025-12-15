import path from 'node:path'
import process from 'node:process'
import * as clack from '@clack/prompts'
import { type Config, type KubbEvents, LogLevel, safeBuild, setup } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import { execa } from 'execa'
import pc from 'picocolors'
import { executeHooks } from '../utils/executeHooks.ts'
import { getSummary } from '../utils/getSummary.ts'

type GenerateProps = {
  input?: string
  config: Config
  events: AsyncEventEmitter<KubbEvents>
  logLevel: number
}

export async function generate({ input, config, events, logLevel }: GenerateProps): Promise<void> {
  const { root = process.cwd(), ...userConfig } = config
  const inputPath = input ?? ('path' in userConfig.input ? userConfig.input.path : undefined)
  const hrStart = process.hrtime()

  await events.emit('generation:start')
  await events.emit(
    'verbose',
    [config.name ? `Loading generation ${pc.dim(config.name)}` : 'Loading generation', logLevel > LogLevel.silent ? `for ${pc.dim(inputPath)}` : undefined]
      .filter(Boolean)
      .join(' '),
  )

  const definedConfig: Config = {
    root,
    ...userConfig,
    input: inputPath
      ? {
          ...userConfig.input,
          path: inputPath,
        }
      : userConfig.input,
    output: {
      write: true,
      barrelType: 'named',
      extension: {
        '.ts': '.ts',
      },
      format: 'prettier',
      ...userConfig.output,
    },
  }

  const { fabric, pluginManager } = await setup({
    config: definedConfig,
    events,
  })

  const { files, failedPlugins, pluginTimings, error } = await safeBuild(
    {
      config: definedConfig,
      events,
    },
    { pluginManager, fabric, events },
  )

  const summary = getSummary({
    failedPlugins,
    filesCreated: files.length,
    config: definedConfig,
    status: failedPlugins.size > 0 || error ? 'failed' : 'success',
    hrStart,
    pluginTimings: logLevel >= LogLevel.verbose ? pluginTimings : undefined,
  })

  // Handle build failures (either from failed plugins or general errors)
  const hasFailures = failedPlugins.size > 0 || error

  if (hasFailures) {
    console.log(`✗  Build failed ${logLevel !== LogLevel.silent ? pc.dim(inputPath!) : ''}`)

    // Collect all errors from failed plugins and general error
    const allErrors: Error[] = [
      error,
      ...Array.from(failedPlugins)
        .filter((it) => it.error)
        .map((it) => it.error),
    ].filter(Boolean)

    allErrors.forEach((err) => {
      // Display error causes in debug mode
      if (logLevel >= LogLevel.debug && err.cause) {
        console.error(err.cause)
      }

      console.error(err)
    })

    clack.box(summary.join(''), config.name || '', {
      width: 'auto',
      formatBorder: pc.red,
      rounded: true,
      withGuide: false,
      contentAlign: 'left',
      titleAlign: 'center',
    })

    process.exit(1)
  }

  await events.emit('generation:end')
  await events.emit('info', `Build completed ${pc.dim(inputPath!)}`)

  // formatting
  if (config.output.format) {
    await events.emit('format:start')

    await events.emit(
      'info',
      [
        `Formatting with ${pc.dim(config.output.format)}`,
        logLevel > LogLevel.silent ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
      ]
        .filter(Boolean)
        .join(' '),
    )

    if (config.output.format === 'prettier') {
      try {
        await events.emit(
          'hook:execute',
          'prettier',
          ['--ignore-unknown', '--write', path.resolve(definedConfig.root, definedConfig.output.path)],
          async (result) => {
            await events.emit(
              'success',
              [
                `Formatting with ${pc.dim(config.output.format as string)}`,
                logLevel > LogLevel.silent ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
                'successfully',
              ]
                .filter(Boolean)
                .join(' '),
            )
            await events.emit('hook:end')
            await events.emit('verbose', result.stdout)
          },
        )
      } catch (e) {
        await events.emit('error', e as Error)
      }

      await events.emit('success', `Formatted with ${config.output.format}`)
    }

    if (config.output.format === 'biome') {
      try {
        const result = await execa('biome', ['format', '--write', path.resolve(definedConfig.root, definedConfig.output.path)], {
          detached: true,
          stdout: logLevel === LogLevel.silent ? undefined : ['pipe'],
          stripFinalNewline: true,
        })

        await events.emit(
          'success',
          [
            `Formatting with ${pc.dim(config.output.format)}`,
            logLevel > LogLevel.silent ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
            'successfully',
          ]
            .filter(Boolean)
            .join(' '),
        )

        await events.emit('verbose', result.stdout)
      } catch (e) {
        const error = new Error('Biome not found')
        error.cause = e
        await events.emit('error', error)
      }
    }

    await events.emit('format:end')
  }

  // linting
  if (config.output.lint) {
    await events.emit('lint:start')

    await events.emit(
      'info',
      [
        `Linting with ${pc.dim(config.output.lint)}`,
        logLevel > LogLevel.silent ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
      ]
        .filter(Boolean)
        .join(' '),
    )

    if (config.output.lint === 'eslint') {
      try {
        const result = await execa('eslint', [path.resolve(definedConfig.root, definedConfig.output.path), '--fix'], {
          detached: true,
          stdout: logLevel === LogLevel.silent ? undefined : ['pipe'],
          stripFinalNewline: true,
        })

        await events.emit(
          'success',
          [
            `Linted with ${pc.dim(config.output.lint)}`,
            logLevel > LogLevel.silent ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
            'successfully',
          ]
            .filter(Boolean)
            .join(' '),
        )
        await events.emit('verbose', result.stdout)
      } catch (e) {
        const error = new Error('Eslint not found')
        error.cause = e
        await events.emit('error', error)
      }
    }

    if (config.output.lint === 'biome') {
      try {
        const result = await execa('biome', ['lint', '--fix', path.resolve(definedConfig.root, definedConfig.output.path)], {
          detached: true,
          stdout: logLevel === LogLevel.silent ? undefined : ['pipe'],
          stripFinalNewline: true,
        })

        await events.emit(
          'success',
          [
            `Linted with ${pc.dim(config.output.lint)}`,
            logLevel > LogLevel.silent ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
            'successfully',
          ]
            .filter(Boolean)
            .join(' '),
        )
        await events.emit('verbose', result.stdout)
      } catch (e) {
        const error = new Error('Biome not found')
        error.cause = e
        await events.emit('error', error)
      }
    }

    if (config.output.lint === 'oxlint') {
      try {
        const result = await execa('oxlint', ['--fix', path.resolve(definedConfig.root, definedConfig.output.path)], {
          detached: true,
          stdout: logLevel === LogLevel.silent ? undefined : ['pipe'],
          stripFinalNewline: true,
        })

        await events.emit(
          'success',
          [
            `Linted with ${pc.dim(config.output.lint)}`,
            logLevel > LogLevel.silent ? `on ${pc.dim(path.resolve(definedConfig.root, definedConfig.output.path))}` : undefined,
            'successfully',
          ]
            .filter(Boolean)
            .join(' '),
        )
        await events.emit('verbose', result.stdout)
      } catch (e) {
        const error = new Error('Oxlint not found')
        error.cause = e
        await events.emit('error', error)
      }
    }

    await events.emit('lint:end')
  }

  if (config.hooks) {
    await events.emit('hooks:start')
    await executeHooks({ hooks: config.hooks, logLevel, events })

    await events.emit('hooks:end')
  }

  clack.box(summary.join(''), config.name || '', {
    width: 'auto',
    formatBorder: pc.green,
    rounded: true,
    withGuide: false,
    contentAlign: 'left',
    titleAlign: 'center',
  })
}
