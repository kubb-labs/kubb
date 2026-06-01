import type { PluginEntry } from '../state.ts'
import { attrs, formatMs } from '../format.ts'
import { ProgressBar } from './ProgressBar.tsx'

type Props = {
  plugins: Array<PluginEntry>
}

function glyph(status: PluginEntry['status']): { char: string; color: string } {
  if (status === 'done') return { char: '●', color: 'green' }
  if (status === 'failed') return { char: '●', color: 'red' }
  if (status === 'running') return { char: '●', color: 'cyan' }
  return { char: '○', color: '#888' }
}

function progressValue(status: PluginEntry['status']): number {
  if (status === 'done' || status === 'failed') return 1
  if (status === 'running') return 0.5
  return 0
}

function statusText(plugin: PluginEntry): { text: string; color: string } {
  if (plugin.status === 'done') return { text: `done · ${formatMs(plugin.duration ?? 0)}`, color: 'green' }
  if (plugin.status === 'failed') return { text: `failed · ${formatMs(plugin.duration ?? 0)}`, color: 'red' }
  if (plugin.status === 'running') return { text: 'generating…', color: 'cyan' }
  return { text: 'queued', color: '#888' }
}

export function PluginsPane({ plugins }: Props) {
  const total = plugins.length
  const completed = plugins.filter((p) => p.status === 'done').length
  const failed = plugins.filter((p) => p.status === 'failed').length
  const title = total === 0 ? 'Plugins' : `Plugins  ${completed}/${total}${failed > 0 ? `  (${failed} failed)` : ''}`

  const maxNameWidth = plugins.reduce((w, p) => Math.max(w, p.name.length), 0)

  return (
    <box title={title} titleAlignment="left" border borderStyle="rounded" borderColor="#444" flexDirection="column" paddingLeft={1} paddingRight={1}>
      {plugins.length === 0 ? (
        <text>
          <span fg="#888" attributes={attrs.dim}>
            waiting for generation to start…
          </span>
        </text>
      ) : (
        plugins.map((plugin) => {
          const g = glyph(plugin.status)
          const s = statusText(plugin)
          return (
            <box key={plugin.name} flexDirection="row" gap={1}>
              <text>
                <span fg={g.color}>{g.char}</span>
                <span>{` ${plugin.name.padEnd(maxNameWidth)}`}</span>
              </text>
              <ProgressBar value={progressValue(plugin.status)} width={16} color={plugin.status === 'failed' ? 'red' : 'green'} />
              <text>
                <span fg={s.color}>{s.text}</span>
              </text>
            </box>
          )
        })
      )}
    </box>
  )
}
