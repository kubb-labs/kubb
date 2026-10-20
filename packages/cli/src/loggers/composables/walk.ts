import process from 'node:process'
import { styleText } from 'node:util'
import { formatMs, getElapsedMs } from '@internals/utils'
import { formatBar, formatMsWithColor } from '../banner.ts'
import { pluralize } from '../../ui/text.ts'
import type { LoggerContext } from './context.ts'
import type { Progress } from './progress.ts'
import type { Spinner } from './spinner.ts'

export type Walk = ReturnType<typeof createWalk>

/** Milliseconds between redraws of the live generation block, about clack's spinner frame rate. */
const WALK_REDRAW_MS = 80

function createState() {
  return {
    totalPlugins: 0,
    completedPlugins: 0,
    failedPlugins: 0,
    /** `process.hrtime()` snapshot taken at the start of generation, for the elapsed time. */
    hrStart: process.hrtime(),
    /** Plugin results held back while the generation step owns the line. */
    pluginLines: [] as Array<string>,
    /** The node walk's live state: the spec's node total, the distinct nodes generated, and each plugin's count and current node. */
    walk: { total: 0, visited: new Set<string>(), plugins: new Map<string, { count: number; current: string }>() },
    lastWalkDraw: 0,
  }
}

/** The node walk the plugins share: the live generation block, and the plugin results printed once the walk ends. */
export function createWalk({ writer, silent, human, text, onRun }: LoggerContext, spinner: Spinner, progress: Progress) {
  const state = createState()

  /** The progress summary line the clack logger shows, `null` when there is nothing to display. */
  function buildProgressLine(): string | null {
    const parts: Array<string> = []
    const duration = formatMs(getElapsedMs(state.hrStart))
    const { totalFiles, processedFiles } = progress.state

    if (state.totalPlugins > 0) {
      const failed = state.failedPlugins > 0 ? ` ${styleText('red', `(${state.failedPlugins} failed)`)}` : ''
      parts.push(`Plugins ${styleText('green', state.completedPlugins.toString())}/${state.totalPlugins}${failed}`)
    }

    if (totalFiles > 0) {
      parts.push(`Files ${styleText('green', processedFiles.toString())}/${totalFiles}`)
    }

    if (parts.length === 0) {
      return null
    }

    parts.push(`${styleText('green', duration)} elapsed`)
    return parts.join(styleText('dim', ' | '))
  }

  if (!silent) {
    onRun('kubb:build:start', ({ nodeCounts: { schemas, operations } }) => {
      state.walk.total = schemas + operations
      const details = `${pluralize(schemas, 'schema')} · ${pluralize(operations, 'operation')} · ${formatMs(getElapsedMs(state.hrStart))}`
      spinner.stop(`Parsed spec  ${styleText('dim', details)}`)
      spinner.start('Generating')
    })

    // Plugins all end after one shared node walk, so per-node hooks keep the step live; plain output would get a line per node.
    if (human) {
      const onNode = (key: string, name: string, plugin: string) => {
        const { total, visited, plugins } = state.walk
        visited.add(key)
        plugins.set(plugin, { count: (plugins.get(plugin)?.count ?? 0) + 1, current: name })

        // Counting stays per node; the redraw waits for the spinner's next frame.
        const now = Date.now()
        if (now - state.lastWalkDraw < WALK_REDRAW_MS) return
        state.lastWalkDraw = now

        const elapsed = styleText('dim', formatMs(getElapsedMs(state.hrStart)))
        const head = total
          ? `Generating  ${formatBar(visited.size, total)}  ${visited.size}/${total} nodes  ${elapsed}`
          : `Generating  ${pluralize(visited.size, 'node')}  ${elapsed}`
        const width = Math.max(...[...plugins.keys()].map((pluginName) => pluginName.length))
        const rows = [...plugins].map(
          ([pluginName, row]) =>
            `${styleText('dim', '│')}   ${pluginName.padEnd(width)}  ${styleText('dim', String(row.count).padStart(4))}  ${styleText('cyan', row.current)}`,
        )
        spinner.message(text([head, ...rows].join('\n')))
      }

      onRun('kubb:generate:schema', (node, { plugin }) => onNode(`schema:${node.name}`, node.name ?? 'schema', plugin.name))
      onRun('kubb:generate:operation', (node, { plugin }) => onNode(`operation:${node.operationId}`, node.operationId, plugin.name))
    }

    // Buffered, not printed: a step redraws over anything written while it runs.
    onRun('kubb:plugin:end', ({ plugin, duration, success }) => {
      state[success ? 'completedPlugins' : 'failedPlugins']++
      state.pluginLines.push(text(`${plugin.name} ${success ? 'completed' : 'failed'} in ${formatMsWithColor(duration)}`))
    })

    onRun('kubb:plugins:end', () => {
      const failed = state.failedPlugins > 0
      spinner.stop(buildProgressLine() ?? undefined, failed ? 'failed' : 'success')

      if (state.pluginLines.length) {
        writer.block(state.pluginLines)
        state.pluginLines = []
      }
    })
  }

  return {
    state,
    reset() {
      Object.assign(state, createState())
    },
  }
}
