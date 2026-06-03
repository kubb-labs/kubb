import { relative } from 'node:path'
import { defineLogger, type HookSinkFactory, type KubbHooks, logLevel as logLevelMap } from '@kubb/core'

/**
 * Tiny fallback logger used by the CLI when the user's `kubb.config.ts` does not set a `logger`.
 * Plain `console.log` output with no styling, spinners, or annotations. Users who want richer
 * output opt into `@kubb/middleware-logger` (or any other `Logger`) via `config.logger`.
 */
export const defaultLogger = defineLogger<{ logLevel: number }, HookSinkFactory>({
  name: 'default',
  install(context, options) {
    const logLevel = options?.logLevel ?? logLevelMap.info

    function onStep<E extends keyof KubbHooks>(event: E, message: string): void {
      context.on(event, () => {
        if (logLevel <= logLevelMap.silent) return
        console.log(message)
      })
    }

    context.on('kubb:info', ({ message, info = '' }) => {
      if (logLevel <= logLevelMap.silent) return
      console.log(['ℹ', message, info].filter(Boolean).join(' '))
    })

    context.on('kubb:success', ({ message, info = '' }) => {
      if (logLevel <= logLevelMap.silent) return
      console.log(['✓', message, logLevel >= logLevelMap.info ? info : undefined].filter(Boolean).join(' '))
    })

    context.on('kubb:warn', ({ message, info = '' }) => {
      if (logLevel < logLevelMap.warn) return
      console.log(['⚠', message, logLevel >= logLevelMap.info ? info : undefined].filter(Boolean).join(' '))
    })

    context.on('kubb:error', ({ error }) => {
      console.log(`✗ ${error.message}`)
    })

    context.on('kubb:lifecycle:start', ({ version }) => {
      console.log(`Kubb CLI v${version}`)
    })

    onStep('kubb:config:start', 'Configuration started')
    onStep('kubb:config:end', 'Configuration completed')

    context.on('kubb:generation:start', ({ config }) => {
      if (logLevel <= logLevelMap.silent) return
      console.log(config.name ? `Generation started for ${config.name}` : 'Generation started')
    })

    context.on('kubb:generation:end', ({ config }) => {
      console.log(config.name ? `Generation completed for ${config.name}` : 'Generation completed')
    })

    context.on('kubb:plugin:start', ({ plugin }) => {
      if (logLevel <= logLevelMap.silent) return
      console.log(`Generating ${plugin.name}`)
    })

    context.on('kubb:plugin:end', ({ plugin, success }) => {
      if (logLevel <= logLevelMap.silent) return
      console.log(success ? `${plugin.name} completed` : `${plugin.name} failed`)
    })

    context.on('kubb:files:processing:start', ({ files }) => {
      if (logLevel <= logLevelMap.silent) return
      console.log(`Writing ${files.length} files`)
    })

    context.on('kubb:files:processing:update', ({ files }) => {
      if (logLevel < logLevelMap.verbose) return
      for (const { file, config } of files) {
        console.log(`Writing ${relative(config.root, file.path)}`)
      }
    })

    context.on('kubb:files:processing:end', () => {
      if (logLevel <= logLevelMap.silent) return
      console.log('Files written successfully')
    })

    onStep('kubb:format:start', 'Format started')
    onStep('kubb:format:end', 'Format completed')
    onStep('kubb:lint:start', 'Lint started')
    onStep('kubb:lint:end', 'Lint completed')
    onStep('kubb:hooks:start', 'Hooks started')
    onStep('kubb:hooks:end', 'Hooks completed')

    context.on('kubb:hook:start', ({ command, args }) => {
      if (logLevel <= logLevelMap.silent) return
      const commandWithArgs = args?.length ? `${command} ${args.join(' ')}` : command
      console.log(`Hook ${commandWithArgs} started`)
    })

    context.on('kubb:hook:end', ({ command, args, success, error }) => {
      if (logLevel <= logLevelMap.silent) return
      const commandWithArgs = args?.length ? `${command} ${args.join(' ')}` : command
      if (success) {
        console.log(`✓ Hook ${commandWithArgs} completed`)
      } else {
        const reason = error?.message ? ` (${error.message})` : ''
        console.log(`✗ Hook ${commandWithArgs} failed${reason}`)
      }
    })

    return (_commandWithArgs: string, _hookId: string) => ({
      onStdout: logLevel > logLevelMap.silent ? (s: string) => console.log(s) : undefined,
      onStderr: logLevel > logLevelMap.silent ? (s: string) => console.error(s) : undefined,
    })
  },
})
