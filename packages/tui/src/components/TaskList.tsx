import type { HookEntry, PluginEntry } from '../state.ts'
import { attrs, formatMs, truncateRight } from '../format.ts'

type Props = {
  plugins: Array<PluginEntry>
  hooks: Array<HookEntry>
  selectedIndex: number
  spinnerFrame: string
}

const NAME_WIDTH = 22
const RIGHT_WIDTH = 10

function pluginGlyph(status: PluginEntry['status'], spinner: string): { char: string; color: string } {
  if (status === 'done') return { char: '✓', color: 'green' }
  if (status === 'failed') return { char: '✗', color: 'red' }
  if (status === 'running') return { char: spinner, color: 'cyan' }
  return { char: '○', color: '#888' }
}

function hookGlyph(status: HookEntry['status'], spinner: string): { char: string; color: string } {
  if (status === 'done') return { char: '✓', color: 'green' }
  if (status === 'failed') return { char: '✗', color: 'red' }
  return { char: spinner, color: 'cyan' }
}

function pluginRight(plugin: PluginEntry): { text: string; color: string } {
  if (plugin.status === 'done') return { text: formatMs(plugin.duration ?? 0), color: 'green' }
  if (plugin.status === 'failed') return { text: formatMs(plugin.duration ?? 0), color: 'red' }
  if (plugin.status === 'running') return { text: 'running…', color: 'cyan' }
  return { text: 'queued', color: '#666' }
}

function hookRight(hook: HookEntry): { text: string; color: string } {
  if (hook.status === 'done') return { text: formatMs((hook.finishedAt ?? Date.now()) - hook.startedAt), color: 'green' }
  if (hook.status === 'failed') return { text: 'failed', color: 'red' }
  return { text: 'running…', color: 'cyan' }
}

export function TaskList({ plugins, hooks, selectedIndex, spinnerFrame }: Props) {
  const total = plugins.length
  const completed = plugins.filter((p) => p.status === 'done').length
  const failed = plugins.filter((p) => p.status === 'failed').length
  const title = total === 0 ? 'Tasks' : `Tasks  ${completed}/${total}${failed > 0 ? `  (${failed} failed)` : ''}`

  return (
    <box
      title={title}
      titleAlignment="left"
      border
      borderStyle="rounded"
      borderColor="#444"
      flexDirection="column"
      paddingLeft={1}
      paddingRight={1}
      width={NAME_WIDTH + RIGHT_WIDTH + 8}
    >
      {plugins.length === 0 ? (
        <text>
          <span fg="#888" attributes={attrs.dim}>
            waiting for generation to start…
          </span>
        </text>
      ) : (
        plugins.map((plugin, index) => {
          const g = pluginGlyph(plugin.status, spinnerFrame)
          const r = pluginRight(plugin)
          const isSelected = index === selectedIndex
          const marker = isSelected ? '▸' : ' '
          const name = truncateRight(plugin.name, NAME_WIDTH).padEnd(NAME_WIDTH)
          return (
            <text key={`p-${plugin.name}`}>
              <span fg={isSelected ? 'cyan' : '#666'}>{marker} </span>
              <span fg={g.color}>{g.char}</span>
              <span fg={isSelected ? 'white' : undefined} attributes={isSelected ? attrs.bold : attrs.none}>
                {` ${name}`}
              </span>
              <span fg={r.color}>{` ${r.text.padStart(RIGHT_WIDTH)}`}</span>
            </text>
          )
        })
      )}
      {hooks.length > 0 ? (
        <>
          <text>
            <span fg="#444" attributes={attrs.dim}>
              ──────────
            </span>
          </text>
          {hooks.map((hook, hookOffset) => {
            const index = plugins.length + hookOffset
            const g = hookGlyph(hook.status, spinnerFrame)
            const r = hookRight(hook)
            const isSelected = index === selectedIndex
            const marker = isSelected ? '▸' : ' '
            const name = truncateRight(hook.command, NAME_WIDTH).padEnd(NAME_WIDTH)
            return (
              <text key={`h-${hook.id}`}>
                <span fg={isSelected ? 'cyan' : '#666'}>{marker} </span>
                <span fg={g.color}>{g.char}</span>
                <span fg={isSelected ? 'white' : '#aaa'} attributes={isSelected ? attrs.bold : attrs.dim}>
                  {` ${name}`}
                </span>
                <span fg={r.color}>{` ${r.text.padStart(RIGHT_WIDTH)}`}</span>
              </text>
            )
          })}
        </>
      ) : null}
    </box>
  )
}
