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
  pluginTimings?: Map<string, number>
}

export function getSummary({ failedPlugins, filesCreated, status, hrStart, config, pluginTimings }: SummaryProps): string[] {
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

  const summaryLines: Array<[string, boolean]> = [
    [`${pc.bold('Plugins:')}        ${meta.plugins}`, true],
    [`${pc.dim('Failed:')}          ${meta.pluginsFailed || 'none'}`, !!meta.pluginsFailed],
    [`${pc.bold('Generated:')}      ${meta.filesCreated} files in ${meta.time}`, true],
  ]

  // Add plugin timing breakdown if available (similar to Vite/NX)
  if (pluginTimings && pluginTimings.size > 0) {
    const MAX_TOP_PLUGINS = 5
    const TIME_SCALE_DIVISOR = 100 // Each 100ms = 1 bar character
    const MAX_BAR_LENGTH = 20

    const sortedTimings = Array.from(pluginTimings.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_TOP_PLUGINS)

    if (sortedTimings.length > 0) {
      summaryLines.push([`${pc.dim('Plugin Timings:')}`, true])
      sortedTimings.forEach(([name, time]) => {
        const timeStr = time >= 1000 ? `${(time / 1000).toFixed(2)}s` : `${time}ms`
        const barLength = Math.min(Math.ceil(time / TIME_SCALE_DIVISOR), MAX_BAR_LENGTH)
        const bar = '█'.repeat(barLength)
        summaryLines.push([`  ${pc.dim(bar)} ${randomCliColour(name)}: ${pc.yellow(timeStr)}`, true])
      })
    }
  }

  summaryLines.push([`${pc.bold('Output:')}         ${meta.output}`, true])

  logs.add(
    summaryLines
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
