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

const NAME_WIDTH = 18
const BAR_WIDTH = 10
const RIGHT_WIDTH = 8
const PANE_WIDTH = NAME_WIDTH + BAR_WIDTH + RIGHT_WIDTH + 14

const FILLED = '▰'
const EMPTY = '▱'

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
  if (plugin.status === 'running') return { text: '…', color: 'cyan' }
  return { text: '·', color: '#666' }
}

function hookRight(hook: HookEntry): { text: string; color: string } {
  if (hook.status === 'done') return { text: formatMs((hook.finishedAt ?? Date.now()) - hook.startedAt), color: 'green' }
  if (hook.status === 'failed') return { text: 'fail', color: 'red' }
  return { text: '…', color: 'cyan' }
}

function statusRatio(status: PluginEntry['status'] | HookEntry['status']): number {
  if (status === 'done') return 1
  if (status === 'failed') return 1
  if (status === 'running') return 0.5
  return 0
}

function barColor(status: PluginEntry['status'] | HookEntry['status']): string {
  if (status === 'failed') return 'red'
  if (status === 'done') return 'green'
  if (status === 'running') return 'cyan'
  return '#444'
}

type BarPieces = {
  filled: number
  empty: number
  color: string
}

function bar(ratio: number, status: PluginEntry['status'] | HookEntry['status']): BarPieces {
  const clamped = Math.max(0, Math.min(1, ratio))
  const filled = Math.round(clamped * BAR_WIDTH)
  return { filled, empty: BAR_WIDTH - filled, color: barColor(status) }
}

type Row = {
  key: string
  marker: boolean
  glyph: { char: string; color: string }
  name: string
  bar: BarPieces
  right: { text: string; color: string }
  nameColor?: string
  selected: boolean
}

function pluginRow(plugin: PluginEntry, index: number, selected: number, spinner: string): Row {
  return {
    key: `p-${plugin.name}`,
    marker: index === selected,
    glyph: pluginGlyph(plugin.status, spinner),
    name: truncateRight(plugin.name, NAME_WIDTH).padEnd(NAME_WIDTH),
    bar: bar(statusRatio(plugin.status), plugin.status),
    right: pluginRight(plugin),
    selected: index === selected,
  }
}

function filesRowOf(files: TuiState['files'], active: boolean, done: boolean, index: number, selected: number, spinner: string): Row {
  let status: PluginEntry['status']
  if (done) status = 'done'
  else if (active) status = 'running'
  else status = 'queued'
  const ratio = files.total === 0 ? 0 : Math.min(1, files.processed / files.total)
  const glyph = done
    ? { char: '✓', color: 'green' }
    : active
      ? { char: spinner, color: 'cyan' }
      : { char: '○', color: '#888' }
  const right = done
    ? { text: `${files.processed}`, color: 'green' }
    : active
      ? { text: `${files.processed}/${files.total}`, color: 'cyan' }
      : { text: '·', color: '#666' }
  return {
    key: 'files-row',
    marker: index === selected,
    glyph,
    name: 'files'.padEnd(NAME_WIDTH),
    bar: bar(active || done ? ratio : 0, status),
    right,
    nameColor: '#aaa',
    selected: index === selected,
  }
}

function hookRowOf(hook: HookEntry, index: number, selected: number, spinner: string): Row {
  return {
    key: `h-${hook.id}`,
    marker: index === selected,
    glyph: hookGlyph(hook.status, spinner),
    name: truncateRight(hook.command, NAME_WIDTH).padEnd(NAME_WIDTH),
    bar: bar(statusRatio(hook.status), hook.status),
    right: hookRight(hook),
    nameColor: '#aaa',
    selected: index === selected,
  }
}

function RowView({ row }: { row: Row }) {
  const markerColor = row.selected ? 'cyan' : '#666'
  const nameAttr = row.selected ? attrs.bold : row.nameColor ? attrs.dim : attrs.none
  const nameFg = row.selected ? 'white' : row.nameColor
  return (
    <text key={row.key}>
      <span fg={markerColor}>{`${row.marker ? '▸' : ' '} `}</span>
      <span fg={row.glyph.color}>{row.glyph.char}</span>
      <span fg={nameFg} attributes={nameAttr}>{` ${row.name}`}</span>
      <span fg={row.bar.color}>{` ${FILLED.repeat(row.bar.filled)}`}</span>
      <span fg="#444" attributes={attrs.dim}>{EMPTY.repeat(row.bar.empty)}</span>
      <span fg={row.right.color}>{` ${row.right.text.padStart(RIGHT_WIDTH)}`}</span>
    </text>
  )
}

export function TaskList({ plugins, hooks, files, filesActive, filesDone, selectedIndex, spinnerFrame }: Props) {
  const total = plugins.length
  const completed = plugins.filter((p) => p.status === 'done').length
  const failed = plugins.filter((p) => p.status === 'failed').length
  const title = total === 0 ? 'Tasks' : `Tasks  ${completed}/${total}${failed > 0 ? `  (${failed} failed)` : ''}`

  const showFilesRow = plugins.length > 0 || hooks.length > 0
  const filesIndex = plugins.length

  return (
    <box
      title={title}
      titleAlignment="left"
      border
      borderStyle="rounded"
      borderColor="#444"
      flexDirection="column"
      paddingLeft={2}
      paddingRight={2}
      paddingTop={1}
      paddingBottom={1}
      width={PANE_WIDTH}
    >
      {plugins.length === 0 ? (
        <text>
          <span fg="#888" attributes={attrs.dim}>
            waiting for generation to start…
          </span>
        </text>
      ) : (
        plugins.map((plugin, index) => <RowView key={`p-${plugin.name}`} row={pluginRow(plugin, index, selectedIndex, spinnerFrame)} />)
      )}

      {showFilesRow ? <RowView row={filesRowOf(files, filesActive, filesDone, filesIndex, selectedIndex, spinnerFrame)} /> : null}

      {hooks.length > 0 ? (
        <>
          <text>
            <span fg="#444" attributes={attrs.dim}>
              ──────────
            </span>
          </text>
          {hooks.map((hook, hookOffset) => {
            const index = plugins.length + 1 + hookOffset
            return <RowView key={`h-${hook.id}`} row={hookRowOf(hook, index, selectedIndex, spinnerFrame)} />
          })}
        </>
      ) : null}
    </box>
  )
}
