import path from 'node:path'
import type { Config, Plugin } from '@kubb/core'
import { formatHrtime } from '@kubb/core/utils'
import pc from 'picocolors'
import { randomCliColor } from './randomColor.ts'

type SummaryProps = {
  failedPlugins: Set<{ plugin: Plugin; error: Error }>
  status: 'success' | 'failed'
  hrStart: [number, number]
  filesCreated: number
  config: Config
  pluginTimings?: Map<string, number>
}

export function getSummary({ failedPlugins, filesCreated, status, hrStart, config, pluginTimings }: SummaryProps): string[] {
  const duration = formatHrtime(hrStart)

  const pluginsCount = config.plugins?.length || 0
  const successCount = pluginsCount - failedPlugins.size

  const meta = {
    plugins:
      status === 'success'
        ? `${pc.green(`${successCount} successful`)}, ${pluginsCount} total`
        : `${pc.green(`${successCount} successful`)}, ${pc.red(`${failedPlugins.size} failed`)}, ${pluginsCount} total`,
    pluginsFailed: status === 'failed' ? [...failedPlugins]?.map(({ plugin }) => randomCliColor(plugin.name))?.join(', ') : undefined,
    filesCreated: filesCreated,
    time: pc.green(duration),
    output: path.isAbsolute(config.root) ? path.resolve(config.root, config.output.path) : config.root,
  } as const

  const labels = {
    plugins: 'Plugins:',
    failed: 'Failed:',
    generated: 'Generated:',
    pluginTimings: 'Plugin Timings:',
    output: 'Output:',
  }
  const maxLength = Math.max(0, ...[...Object.values(labels), ...(pluginTimings ? Array.from(pluginTimings.keys()) : [])].map((s) => s.length))

  const summaryLines: string[] = []
  summaryLines.push(`${labels.plugins.padEnd(maxLength + 2)} ${meta.plugins}`)

  if (meta.pluginsFailed) {
    summaryLines.push(`${labels.failed.padEnd(maxLength + 2)} ${meta.pluginsFailed}`)
  }

  summaryLines.push(`${labels.generated.padEnd(maxLength + 2)} ${meta.filesCreated} files in ${meta.time}`)

  if (pluginTimings && pluginTimings.size > 0) {
    const TIME_SCALE_DIVISOR = 100
    const MAX_BAR_LENGTH = 10

    const sortedTimings = Array.from(pluginTimings.entries()).sort((a, b) => b[1] - a[1])

    if (sortedTimings.length > 0) {
      summaryLines.push(`${labels.pluginTimings}`)

      sortedTimings.forEach(([name, time]) => {
        const timeStr = time >= 1000 ? `${(time / 1000).toFixed(2)}s` : `${Math.round(time)}ms`
        const barLength = Math.min(Math.ceil(time / TIME_SCALE_DIVISOR), MAX_BAR_LENGTH)
        const bar = pc.dim('█'.repeat(barLength))

        summaryLines.push(`${pc.dim('•')} ${name.padEnd(maxLength + 1)}${bar} ${timeStr}`)
      })
    }
  }

  summaryLines.push(`${labels.output.padEnd(maxLength + 2)} ${meta.output}`)

  return summaryLines
}
