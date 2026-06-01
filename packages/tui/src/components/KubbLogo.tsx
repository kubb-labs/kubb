import { attrs } from '../format.ts'

type Props = {
  version: string
  configName?: string
  status: 'idle' | 'running' | 'success' | 'failed'
}

const ORANGE = '#F58517'
const BROWN = '#8B5A2B'
const HIGHLIGHT = '#F5A217'
const EYE = '#FFE082'
const BLUSH = '#FF6B6B'

// 17-cell robot face + right column for version / config / subtitle.
// Pinned width keeps opentui from reflowing when the logo shares a row with
// the flex-sized HeaderBar.
const LOGO_WIDTH = 48

// Spaces stored as constants so the formatter never collapses them, which
// otherwise breaks the robot's horizontal alignment.
const S5 = ' '.repeat(5)
const S2 = ' '.repeat(2)

function subtitle(status: Props['status']): { text: string; color: string } {
  if (status === 'success') return { text: 'Done', color: 'green' }
  if (status === 'failed') return { text: 'Failed', color: 'red' }
  if (status === 'running') return { text: 'Generating…', color: 'cyan' }
  return { text: 'Ready to generate', color: 'white' }
}

export function KubbLogo({ version, configName, status }: Props) {
  const sub = subtitle(status)
  return (
    <box flexDirection="column" paddingLeft={2} paddingRight={2} width={LOGO_WIDTH}>
      <text>
        <span fg={BROWN}>{` ▄▄▄▄▄▄▄▄▄▄▄▄▄`}</span>
      </text>
      <text>
        <span fg={BROWN}>{'█  '}</span>
        <span fg={HIGHLIGHT}>{'▄▄'}</span>
        <span fg={BROWN}>{S5}</span>
        <span fg={HIGHLIGHT}>{'▄▄'}</span>
        <span fg={BROWN}>{'  █'}</span>
        <span fg={ORANGE} attributes={attrs.bold}>{`${S2}KUBB v${version || '—'}`}</span>
      </text>
      <text>
        <span fg={BROWN}>{'█ '}</span>
        <span fg={EYE}>{'█▀█'}</span>
        <span fg={BROWN}>{S5}</span>
        <span fg={EYE}>{'█▀█'}</span>
        <span fg={BROWN}>{' █'}</span>
        <span fg="#888" attributes={attrs.dim}>{`${S2}${configName ?? 'kubb.config.ts'}`}</span>
      </text>
      <text>
        <span fg={BROWN}>{'█ '}</span>
        <span fg={EYE}>{'▀▀▀'}</span>
        <span fg={BROWN}>{S2}</span>
        <span fg={BLUSH}>{'◡'}</span>
        <span fg={BROWN}>{S2}</span>
        <span fg={EYE}>{'▀▀▀'}</span>
        <span fg={BROWN}>{' █'}</span>
        <span fg="#888" attributes={attrs.dim}>
          {S2}
        </span>
        <span fg="yellow">{'➜ '}</span>
        <span fg={sub.color}>{sub.text}</span>
      </text>
      <text>
        <span fg={BROWN}>{` ▀▀▀▀▀▀▀▀▀▀▀▀▀`}</span>
      </text>
    </box>
  )
}
