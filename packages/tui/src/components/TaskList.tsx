import type { HookEntry, PluginEntry, TuiState } from '../state.ts'
import { attrs, formatMs, truncateRight } from '../format.ts'

type Props = {
  plugins: Array<PluginEntry>
  hooks: Array<HookEntry>
  files: TuiState['files']
  filesActive: boolean
  filesDone: boolean
  selectedIndex: number
  spinnerFrame: string
}

const NAME_WIDTH = 20
const RIGHT_WIDTH = 10
const PANE_WIDTH = NAME_WIDTH + RIGHT_WIDTH + 12

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

type FilesRow = {
  glyph: { char: string; color: string }
  right: { text: string; color: string }
  label: string
}

function filesRow(files: TuiState['files'], filesActive: boolean, filesDone: boolean, spinner: string): FilesRow {
  if (filesActive) {
    return {
      glyph: { char: spinner, color: 'cyan' },
      right: { text: `${files.processed}/${files.total}`, color: 'cyan' },
      label: 'files',
    }
  }
  if (filesDone) {
    return {
      glyph: { char: '✓', color: 'green' },
      right: { text: `${files.processed}`, color: 'green' },
      label: 'files',
    }
  }
  return {
    glyph: { char: '○', color: '#888' },
    right: { text: 'queued', color: '#666' },
    label: 'files',
  }
}

export function TaskList({ plugins, hooks, files, filesActive, filesDone, selectedIndex, spinnerFrame }: Props) {
  const total = plugins.length
  const completed = plugins.filter((p) => p.status === 'done').length
  const failed = plugins.filter((p) => p.status === 'failed').length
  const title = total === 0 ? 'Tasks' : `Tasks  ${completed}/${total}${failed > 0 ? `  (${failed} failed)` : ''}`

  const showFilesRow = plugins.length > 0 || hooks.length > 0
  const filesIndex = plugins.length
  const fr = filesRow(files, filesActive, filesDone, spinnerFrame)

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
      width={PANE_WIDTH}
    >
      {plugins.length === 0 ? (
        <text>
          <span fg="#888" attributes={attrs.dim}>waiting for generation to start…</span>
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
              <span fg={isSelected ? 'cyan' : '#666'}>{`${marker} `}</span>
              <span fg={g.color}>{g.char}</span>
              <span fg={isSelected ? 'white' : undefined} attributes={isSelected ? attrs.bold : attrs.none}>
                {` ${name}`}
              </span>
              <span fg={r.color}>{` ${r.text.padStart(RIGHT_WIDTH)}`}</span>
            </text>
          )
        })
      )}

      {showFilesRow ? (
        <text key="files-row">
          <span fg={filesIndex === selectedIndex ? 'cyan' : '#666'}>{`${filesIndex === selectedIndex ? '▸' : ' '} `}</span>
          <span fg={fr.glyph.color}>{fr.glyph.char}</span>
          <span fg={filesIndex === selectedIndex ? 'white' : '#aaa'} attributes={filesIndex === selectedIndex ? attrs.bold : attrs.dim}>
            {` ${truncateRight(fr.label, NAME_WIDTH).padEnd(NAME_WIDTH)}`}
          </span>
          <span fg={fr.right.color}>{` ${fr.right.text.padStart(RIGHT_WIDTH)}`}</span>
        </text>
      ) : null}

      {hooks.length > 0 ? (
        <>
          <text>
            <span fg="#444" attributes={attrs.dim}>──────────</span>
          </text>
          {hooks.map((hook, hookOffset) => {
            const index = plugins.length + 1 + hookOffset
            const g = hookGlyph(hook.status, spinnerFrame)
            const r = hookRight(hook)
            const isSelected = index === selectedIndex
            const marker = isSelected ? '▸' : ' '
            const name = truncateRight(hook.command, NAME_WIDTH).padEnd(NAME_WIDTH)
            return (
              <text key={`h-${hook.id}`}>
                <span fg={isSelected ? 'cyan' : '#666'}>{`${marker} `}</span>
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
