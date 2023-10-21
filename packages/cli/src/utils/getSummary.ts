import pathParser from 'node:path'

import { LogLevel, randomPicoColour } from '@kubb/core'

import pc from 'picocolors'

import { parseHrtimeToSeconds } from './parseHrtimeToSeconds.ts'

import type { BuildOutput, KubbConfig } from '@kubb/core'

type SummaryProps = {
  pluginManager: BuildOutput['pluginManager']
  status: 'success' | 'failed'
  hrstart: [number, number]
  config: KubbConfig
  logLevel?: LogLevel
}

export function getSummary({ pluginManager, status, hrstart, config, logLevel }: SummaryProps): string[] {
  const logs: string[] = []
  const elapsedSeconds = parseHrtimeToSeconds(process.hrtime(hrstart))

  const buildStartPlugins = [
    ...new Set(pluginManager.executed.filter((item) => item.hookName === 'buildStart' && item.plugin.name !== 'core').map((item) => item.plugin.name)),
  ]

  const failedPlugins = config.plugins?.filter((plugin) => !buildStartPlugins.includes(plugin.name))?.map((plugin) => plugin.name)
  const pluginsCount = config.plugins?.length || 0
  const files = pluginManager.fileManager.files.sort((a, b) => {
    if (!a.meta?.pluginKey?.[1] || !b.meta?.pluginKey?.[1]) {
      return 0
    }
    if (a.meta?.pluginKey?.[1]?.length < b.meta?.pluginKey?.[1]?.length) {
      return 1
    }
    if (a.meta?.pluginKey?.[1]?.length > b.meta?.pluginKey?.[1]?.length) {
      return -1
    }
    return 0
  })

  const meta = {
    plugins: status === 'success'
      ? `${pc.green(`${buildStartPlugins.length} successful`)}, ${pluginsCount} total`
      : `${pc.red(`${failedPlugins?.length ?? 1} failed`)}, ${pluginsCount} total`,
    pluginsFailed: status === 'failed' ? failedPlugins?.map((name) => randomPicoColour(name))?.join(', ') : undefined,
    filesCreated: files.length,
    time: pc.yellow(`${elapsedSeconds}s`),
    output: pathParser.resolve(config.root, config.output.path),
  } as const

  if (logLevel === LogLevel.debug) {
    logs.push(pc.bold('\nGenerated files:\n'))
    logs.push(files.map((file) => `${randomPicoColour(JSON.stringify(file.meta?.pluginKey))} ${file.path}`).join('\n'))
  }

  logs.push(
    [
      [`\n`, true],
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
