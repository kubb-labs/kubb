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
// Robot face is 17 cells wide; right column adds version/config/subtitle —
// pin to 44 so opentui doesn't reflow lines when the logo sits in a row
// with HeaderBar(flexGrow=1).
const LOGO_WIDTH = 44

/**
 * Five-line ASCII robot face that matches the `getIntro` banner used by the
 * clack logger, rebuilt with opentui spans so the colors render natively
 * inside the TUI instead of leaking ANSI escapes.
 */
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
        <span fg={BROWN}> ▄▄▄▄▄▄▄▄▄▄▄▄▄</span>
      </text>
      <text>
        <span fg={BROWN}>█ </span>
        <span fg={HIGHLIGHT}> ▄▄</span>
        <span fg={BROWN}> </span>
        <span fg={HIGHLIGHT}>▄▄ </span>
        <span fg={BROWN}>█</span>
        <span fg={ORANGE} attributes={attrs.bold}>{`  KUBB v${version}`}</span>
      </text>
      <text>
        <span fg={BROWN}>█ </span>
        <span fg={EYE}>█▀█</span>
        <span fg={BROWN}> </span>
        <span fg={EYE}>█▀█</span>
        <span fg={BROWN}> █</span>
        <span fg="#888" attributes={attrs.dim}>{`  ${configName ?? 'kubb.config.ts'}`}</span>
      </text>
      <text>
        <span fg={BROWN}>█ </span>
        <span fg={EYE}>▀▀▀</span>
        <span fg={BROWN}> </span>
        <span fg={BLUSH}>◡</span>
        <span fg={BROWN}> </span>
        <span fg={EYE}>▀▀▀</span>
        <span fg={BROWN}> █</span>
        <span fg="#888" attributes={attrs.dim}>
          {'  '}
        </span>
        <span fg="yellow">{'➜ '}</span>
        <span fg={sub.color}>{sub.text}</span>
      </text>
      <text>
        <span fg={BROWN}> ▀▀▀▀▀▀▀▀▀▀▀▀▀</span>
      </text>
    </box>
  )
}
