import path from 'node:path'

import { LogLevel, randomCliColour } from '@kubb/core/logger'

import c from 'tinyrainbow'

import { parseHrtimeToSeconds } from './parseHrtimeToSeconds.ts'

import type { Config, PluginManager } from '@kubb/core'
import type { Logger } from '@kubb/core/logger'

type SummaryProps = {
  pluginManager: PluginManager
  status: 'success' | 'failed'
  hrstart: [number, number]
  config: Config
  logger: Logger
}

export function getSummary({ pluginManager, status, hrstart, config, logger }: SummaryProps): string[] {
  const { logLevel } = logger
  const logs: string[] = []
  const elapsedSeconds = parseHrtimeToSeconds(process.hrtime(hrstart))

  const buildStartPlugins = pluginManager.executed
    .filter((item) => item.hookName === 'buildStart' && item.plugin.name !== 'core')
    .map((item) => item.plugin.name)

  const buildEndPlugins = pluginManager.executed
    .filter((item) => item.hookName === 'buildEnd' && item.plugin.name !== 'core')
    .map((item) => item.plugin.name)

  const failedPlugins = config.plugins?.filter((plugin) => !buildEndPlugins.includes(plugin.name))?.map((plugin) => plugin.name)
  const pluginsCount = config.plugins?.length || 0
  const files = pluginManager.fileManager.files.sort((a, b) => {
    if (!a.meta?.pluginKey?.[0] || !b.meta?.pluginKey?.[0]) {
      return 0
    }
    if (a.meta?.pluginKey?.[0]?.length < b.meta?.pluginKey?.[0]?.length) {
      return 1
    }
    if (a.meta?.pluginKey?.[0]?.length > b.meta?.pluginKey?.[0]?.length) {
      return -1
    }
    return 0
  })

  const meta = {
    name: config.name,
    plugins: status === 'success'
      ? `${c.green(`${buildStartPlugins.length} successful`)}, ${pluginsCount} total`
      : `${c.red(`${failedPlugins?.length ?? 1} failed`)}, ${pluginsCount} total`,
    pluginsFailed: status === 'failed' ? failedPlugins?.map((name) => randomCliColour(name))?.join(', ') : undefined,
    filesCreated: files.length,
    time: c.yellow(`${elapsedSeconds}s`),
    output: path.resolve(config.root, config.output.path),
  } as const

  if (logLevel === LogLevel.debug) {
    logger.debug(c.bold('\nGenerated files:\n'))
    logger.debug(files.map((file) => `${randomCliColour(JSON.stringify(file.meta?.pluginKey))} ${file.path}`).join('\n'))
  }

  logs.push(
    [
      [`\n`, true],
      [`     ${c.bold('Name:')}      ${meta.name}`, !!meta.name],
      [`  ${c.bold('Plugins:')}      ${meta.plugins}`, true],
      [`   ${c.dim('Failed:')}      ${meta.pluginsFailed || 'none'}`, !!meta.pluginsFailed],
      [`${c.bold('Generated:')}      ${meta.filesCreated} files`, true],
      [`     ${c.bold('Time:')}      ${meta.time}`, true],
      [`   ${c.bold('Output:')}      ${meta.output}`, true],
      [`\n`, true],
    ]
      .map((item) => {
        if (item.at(1)) {
          return item.at(0)
        }
        return undefined
      })
      .filter(Boolean)
      .join('\n'),
  )

  return logs
}
