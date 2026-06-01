import type { TuiState } from '../state.ts'
import { attrs, truncateLeft } from '../format.ts'
import { ProgressBar } from './ProgressBar.tsx'

type Props = {
  files: TuiState['files']
}

export function FilesPane({ files }: Props) {
  const ratio = files.total === 0 ? 0 : files.processed / files.total
  const title = files.total === 0 ? 'Files' : `Files  ${files.processed}/${files.total}`

  return (
    <box title={title} titleAlignment="left" border borderStyle="rounded" borderColor="#444" flexDirection="column" paddingLeft={1} paddingRight={1}>
      <box flexDirection="row" gap={1}>
        <ProgressBar value={ratio} width={32} />
        <text>
          <span fg="#888">{`${Math.round(ratio * 100)}%`}</span>
        </text>
      </box>
      <text>
        <span fg="#888" attributes={attrs.dim}>{files.current ? truncateLeft(files.current, 80) : 'idle'}</span>
      </text>
    </box>
  )
}
