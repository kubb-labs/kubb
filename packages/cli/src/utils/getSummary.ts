import path from 'node:path'
import type { Config, PluginManager } from '@kubb/core'
import { randomCliColour } from '@kubb/core/logger'
import pc from 'picocolors'
import { parseHrtimeToSeconds } from './parseHrtimeToSeconds.ts'

type SummaryProps = {
  pluginManager: PluginManager
  status: 'success' | 'failed'
  hrStart: [number, number]
  filesCreated: number
  config: Config
}

export function getSummary({ pluginManager, filesCreated, status, hrStart, config }: SummaryProps): string[] {
  const logs = new Set<string>()
  const elapsedSeconds = parseHrtimeToSeconds(process.hrtime(hrStart))

  const buildStartPlugins = pluginManager.executed
    .filter((item) => item.hookName === 'buildStart' && item.plugin.name !== 'core')
    .map((item) => item.plugin.name)

  const buildEndPlugins = pluginManager.executed.filter((item) => item.hookName === 'buildEnd' && item.plugin.name !== 'core').map((item) => item.plugin.name)

  const failedPlugins = config.plugins?.filter((plugin) => !buildEndPlugins.includes(plugin.name))?.map((plugin) => plugin.name)
  const pluginsCount = config.plugins?.length || 0

  const meta = {
    plugins:
      status === 'success'
        ? `${pc.green(`${buildStartPlugins.length} successful`)}, ${pluginsCount} total`
        : `${pc.red(`${failedPlugins?.length ?? 1} failed`)}, ${pluginsCount} total`,
    pluginsFailed: status === 'failed' ? failedPlugins?.map((name) => randomCliColour(name))?.join(', ') : undefined,
    filesCreated: filesCreated,
    time: `${pc.yellow(`${elapsedSeconds}s`)}`,
    output: path.isAbsolute(config.root) ? path.resolve(config.root, config.output.path) : config.root,
  } as const

  logs.add(
    [
      [`${pc.bold('Plugins:')}        ${meta.plugins}`, true],
      [`${pc.dim('Failed:')}          ${meta.pluginsFailed || 'none'}`, !!meta.pluginsFailed],
      [`${pc.bold('Generated:')}      ${meta.filesCreated} files in ${meta.time}`, true],
      [`${pc.bold('Output:')}         ${meta.output}`, true],
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

  return [...logs]
}
