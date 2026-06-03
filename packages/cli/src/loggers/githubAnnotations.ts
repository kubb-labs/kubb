import process from 'node:process'
import { type Config, diagnosticCode, Diagnostics, isProblemDiagnostic, type LoggerContext, type LoggerOptions, logLevel as logLevelMap } from '@kubb/core'
import { formatCommandWithArgs } from './utils.ts'

/**
 * Mirrors logger events as GitHub Actions workflow commands so the CI UI can highlight warnings,
 * errors, and notices in the annotations panel and group sections into collapsible blocks.
 * Install alongside the main consola logger only when `isGitHubActions()` is true. The decorator
 * registers before the logger so `::group::` is emitted ahead of the section's first log line.
 */
export function installGitHubAnnotations(context: LoggerContext, options: LoggerOptions): void {
  const { logLevel } = options
  const state = {
    currentConfigs: [] as Array<Config>,
    openGroupDepth: 0,
  }

  function openGroup(name: string): void {
    process.stdout.write(`::group::${name}\n`)
    state.openGroupDepth++
  }

  function closeGroup(): void {
    if (state.openGroupDepth === 0) return
    process.stdout.write('::endgroup::\n')
    state.openGroupDepth--
  }

  function closeAllGroups(): void {
    while (state.openGroupDepth > 0) closeGroup()
  }

  context.on('kubb:config:start', () => {
    if (logLevel <= logLevelMap.silent) return
    openGroup('Configuration')
  })

  context.on('kubb:config:end', ({ configs }) => {
    state.currentConfigs = configs
    if (logLevel <= logLevelMap.silent) return
    closeGroup()
  })

  context.on('kubb:generation:start', ({ config }) => {
    if (state.currentConfigs.length <= 1) return
    openGroup(config.name ? `Generation for ${config.name}` : 'Generation')
  })

  context.on('kubb:generation:end', () => {
    if (state.currentConfigs.length <= 1) return
    closeGroup()
  })

  context.on('kubb:plugin:start', ({ plugin }) => {
    if (logLevel <= logLevelMap.silent || state.currentConfigs.length !== 1) return
    openGroup(`Plugin: ${plugin.name}`)
  })

  context.on('kubb:plugin:end', () => {
    if (logLevel <= logLevelMap.silent || state.currentConfigs.length !== 1) return
    closeGroup()
  })

  context.on('kubb:files:processing:start', () => {
    if (logLevel <= logLevelMap.silent || state.currentConfigs.length !== 1) return
    openGroup('File Generation')
  })

  context.on('kubb:files:processing:end', () => {
    if (logLevel <= logLevelMap.silent || state.currentConfigs.length !== 1) return
    closeGroup()
  })

  const groupSection = (
    start: 'kubb:format:start' | 'kubb:lint:start' | 'kubb:hooks:start',
    end: 'kubb:format:end' | 'kubb:lint:end' | 'kubb:hooks:end',
    name: string,
  ): void => {
    context.on(start, () => {
      if (logLevel <= logLevelMap.silent || state.currentConfigs.length !== 1) return
      openGroup(name)
    })
    context.on(end, () => {
      if (logLevel <= logLevelMap.silent || state.currentConfigs.length !== 1) return
      closeGroup()
    })
  }

  groupSection('kubb:format:start', 'kubb:format:end', 'Formatting')
  groupSection('kubb:lint:start', 'kubb:lint:end', 'Linting')
  groupSection('kubb:hooks:start', 'kubb:hooks:end', 'Hooks')

  context.on('kubb:hook:start', ({ command, args }) => {
    if (logLevel <= logLevelMap.silent || state.currentConfigs.length !== 1) return
    openGroup(`Hook ${formatCommandWithArgs(command, args)}`)
  })

  context.on('kubb:hook:end', () => {
    if (logLevel <= logLevelMap.silent || state.currentConfigs.length !== 1) return
    closeGroup()
  })

  context.on('kubb:warn', ({ message }) => {
    if (logLevel < logLevelMap.warn) return
    process.stdout.write(`::warning::${message}\n`)
  })

  context.on('kubb:error', ({ error }) => {
    closeAllGroups()
    process.stderr.write(`::error::${error.message || String(error)}\n`)
  })

  context.on('kubb:diagnostic', ({ diagnostic }) => {
    if (logLevel <= logLevelMap.silent && diagnostic.severity !== 'error') return

    if (!isProblemDiagnostic(diagnostic)) {
      if (diagnostic.severity === 'info') {
        process.stdout.write(`::notice::${diagnostic.message}\n`)
      }
      return
    }

    const parts = [`${diagnostic.code} ${diagnostic.message}`]
    if (diagnostic.location && 'pointer' in diagnostic.location) {
      parts.push(`(at ${diagnostic.location.pointer})`)
    }
    if (diagnostic.plugin) {
      parts.push(`[plugin: ${diagnostic.plugin}]`)
    }
    if (diagnostic.help) {
      parts.push(`help: ${diagnostic.help}`)
    }
    if (diagnostic.code !== diagnosticCode.unknown) {
      parts.push(`docs: ${Diagnostics.docsUrl(diagnostic.code)}`)
    }

    const line = parts.join(' ')

    if (diagnostic.severity === 'error') {
      closeAllGroups()
      process.stderr.write(`::error::${line}\n`)
      return
    }

    if (diagnostic.severity === 'warning') {
      process.stdout.write(`::warning::${line}\n`)
      return
    }

    process.stdout.write(`::notice::${line}\n`)
  })

  context.on('kubb:lifecycle:end', () => {
    closeAllGroups()
  })
}
