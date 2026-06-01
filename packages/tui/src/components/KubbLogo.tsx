import { attrs } from '../format.ts'

type Props = {
  version: string
  configName?: string
}

const ORANGE = '#F58517'
const BROWN = '#8B5A2B'
const HIGHLIGHT = '#F5A217'
const EYE = '#FFE082'
const BLUSH = '#FF6B6B'

/**
 * Five-line ASCII robot face that matches the `getIntro` banner used by the
 * clack logger, rebuilt with opentui spans so the colors render natively
 * inside the TUI instead of leaking ANSI escapes.
 */
export function KubbLogo({ version, configName }: Props) {
  return (
    <box flexDirection="column" paddingLeft={2} paddingRight={2}>
      <text>
        <span fg={BROWN}> ▄▄▄▄▄▄▄▄▄▄▄▄▄</span>
      </text>
      <text>
        <span fg={BROWN}>█ </span>
        <span fg={HIGHLIGHT}> ▄▄</span>
        <span fg={BROWN}>     </span>
        <span fg={HIGHLIGHT}>▄▄ </span>
        <span fg={BROWN}>█</span>
        <span fg={ORANGE} attributes={attrs.bold}>{`  KUBB v${version}`}</span>
      </text>
      <text>
        <span fg={BROWN}>█ </span>
        <span fg={EYE}>█▀█</span>
        <span fg={BROWN}>     </span>
        <span fg={EYE}>█▀█</span>
        <span fg={BROWN}> █</span>
        <span fg="#888" attributes={attrs.dim}>{`  ${configName ?? 'kubb.config.ts'}`}</span>
      </text>
      <text>
        <span fg={BROWN}>█ </span>
        <span fg={EYE}>▀▀▀</span>
        <span fg={BROWN}>  </span>
        <span fg={BLUSH}>◡</span>
        <span fg={BROWN}>  </span>
        <span fg={EYE}>▀▀▀</span>
        <span fg={BROWN}> █</span>
        <span fg="#888" attributes={attrs.dim}>{'  '}</span>
        <span fg="yellow">{'➜ '}</span>
        <span fg="white">Ready to generate</span>
      </text>
      <text>
        <span fg={BROWN}> ▀▀▀▀▀▀▀▀▀▀▀▀▀</span>
      </text>
    </box>
  )
}
