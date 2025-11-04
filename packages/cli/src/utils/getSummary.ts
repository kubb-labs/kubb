import path from 'node:path'
import type { Config, Plugin } from '@kubb/core'
import { randomCliColour } from '@kubb/core/logger'
import pc from 'picocolors'
import { parseHrtimeToSeconds } from './parseHrtimeToSeconds.ts'

type SummaryProps = {
  failedPlugins: Set<{ plugin: Plugin; error: Error }>
  status: 'success' | 'failed'
  hrStart: [number, number]
  filesCreated: number
  config: Config
}

export function getSummary({ failedPlugins, filesCreated, status, hrStart, config }: SummaryProps): string[] {
  const logs = new Set<string>()
  const elapsedSeconds = parseHrtimeToSeconds(process.hrtime(hrStart))

  const pluginsCount = config.plugins?.length || 0
  const successCount = pluginsCount - failedPlugins.size

  const meta = {
    plugins:
      status === 'success'
        ? `${pc.green(`${successCount} successful`)}, ${pluginsCount} total`
        : `${pc.red(`${failedPlugins.size ?? 1} failed`)}, ${pluginsCount} total`,
    pluginsFailed: status === 'failed' ? [...failedPlugins]?.map(({ plugin }) => randomCliColour(plugin.name))?.join(', ') : undefined,
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
