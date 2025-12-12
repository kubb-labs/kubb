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
        : `${pc.green(`${successCount} successful`)}, ${pc.red(`${failedPlugins.size} failed`)}, ${pluginsCount} total`,
    pluginsFailed: status === 'failed' ? [...failedPlugins]?.map(({ plugin }) => randomCliColour(plugin.name))?.join(', ') : undefined,
    filesCreated: filesCreated,
    time: `${elapsedSeconds}s`,
    output: path.isAbsolute(config.root) ? path.resolve(config.root, config.output.path) : config.root,
  } as const

  // Calculate label padding for perfect alignment
  const labels = {
    plugins: 'Plugins:',
    failed: 'Failed:',
    generated: 'Generated:',
    pluginTimings: 'Plugin Timings:',
    output: 'Output:',
  }
  const maxLabelLength = Math.max(...Object.values(labels).map((l) => l.length))

  // Two-column layout: left side for labels/values, right side for time
  const BOX_WIDTH = 60 // Approximate width of the content area
  const summaryLines: string[] = []

  // First line: empty with time on the right
  const timeDisplay = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
  const firstLine = ''.padEnd(BOX_WIDTH - timeDisplay.length) + pc.dim(timeDisplay)
  summaryLines.push(firstLine)
  summaryLines.push('') // Empty line after time

  // Plugins line
  summaryLines.push(`${labels.plugins.padEnd(maxLabelLength + 2)} ${meta.plugins}`)

  // Failed plugins (if any)
  if (meta.pluginsFailed) {
    summaryLines.push(`${labels.failed.padEnd(maxLabelLength + 2)} ${meta.pluginsFailed}`)
  }

  // Generated files
  summaryLines.push(`${labels.generated.padEnd(maxLabelLength + 2)} ${meta.filesCreated} files in ${meta.time}`)

  // Add plugin timing breakdown if available
  if (pluginTimings && pluginTimings.size > 0) {
    const MAX_TOP_PLUGINS = 5
    const TIME_SCALE_DIVISOR = 100 // Each 100ms = 1 bar character
    const MAX_BAR_LENGTH = 10

    const sortedTimings = Array.from(pluginTimings.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_TOP_PLUGINS)

    if (sortedTimings.length > 0) {
      summaryLines.push(`${labels.pluginTimings}`)

      // Find the longest plugin name for alignment
      const maxNameLength = Math.max(...sortedTimings.map(([name]) => name.length))

      sortedTimings.forEach(([name, time]) => {
        const timeStr = time >= 1000 ? `${(time / 1000).toFixed(2)}s` : `${Math.round(time)}ms`
        const barLength = Math.min(Math.ceil(time / TIME_SCALE_DIVISOR), MAX_BAR_LENGTH)
        const bar = pc.dim('█'.repeat(barLength))

        // Format: "  • plugin-name  ██ 123ms"
        summaryLines.push(`  ${pc.dim('•')} ${name.padEnd(maxNameLength + 2)}${bar} ${timeStr}`)
      })
    }
  }

  // Output line
  summaryLines.push(`${labels.output.padEnd(maxLabelLength + 2)} ${meta.output}`)

  summaryLines.push('') // Empty line at the end

  logs.add(summaryLines.join('\n'))

  return [...logs]
}
