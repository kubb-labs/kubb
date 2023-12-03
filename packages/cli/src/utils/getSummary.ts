import path from 'node:path'

import { LogLevel, randomPicoColour } from '@kubb/core/logger'

import pc from 'picocolors'

import { parseHrtimeToSeconds } from './parseHrtimeToSeconds.ts'

import type { KubbConfig, PluginManager } from '@kubb/core'

type SummaryProps = {
  pluginManager: PluginManager
  status: 'success' | 'failed'
  hrstart: [number, number]
  config: KubbConfig
  logLevel?: LogLevel
}

export function getSummary({ pluginManager, status, hrstart, config, logLevel }: SummaryProps): string[] {
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
      ? `${pc.green(`${buildStartPlugins.length} successful`)}, ${pluginsCount} total`
      : `${pc.red(`${failedPlugins?.length ?? 1} failed`)}, ${pluginsCount} total`,
    pluginsFailed: status === 'failed' ? failedPlugins?.map((name) => randomPicoColour(name))?.join(', ') : undefined,
    filesCreated: files.length,
    time: pc.yellow(`${elapsedSeconds}s`),
    output: path.resolve(config.root, config.output.path),
  } as const

  if (logLevel === LogLevel.debug) {
    logs.push(pc.bold('\nGenerated files:\n'))
    logs.push(files.map((file) => `${randomPicoColour(JSON.stringify(file.meta?.pluginKey))} ${file.path}`).join('\n'))
  }

  logs.push(
    [
      [`\n`, true],
      [`     ${pc.bold('Name:')}      ${meta.name}`, !!meta.name],
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
      .join('\n'),
  )

  return logs
}
