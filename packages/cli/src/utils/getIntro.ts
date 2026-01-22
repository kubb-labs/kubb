import process from 'node:process'
import { default as gradientString } from 'gradient-string'
import pc from 'picocolors'
import { hex } from './ansiColors.ts'


// Custom Color Palette for "Wooden" Depth
const colors = {
  lid: hex('#F55A17'), // Dark Wood
  woodTop: hex('#F5A217'), // Bright Orange (Light source)
  woodMid: hex('#F58517'), // Main Orange
  woodBase: hex('#B45309'), // Shadow Orange
  eye: hex('#FFFFFF'), // Deep Slate
  highlight: hex('#adadc6'), // Eye shine
  blush: hex('#FDA4AF'), // Soft Rose
}


const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Generates the Kubb mascot face welcome message
 * @param version - The version string to display
 * @returns Formatted mascot face string
 */
export function getIntro({ title, description, version, areEyesOpen }: { title: string; description: string; version: string; areEyesOpen: boolean }): string {
  // Use gradient-string for the KUBB version text
  const kubbVersion = gradientString(['#F58517', '#F5A217', '#F55A17'])(`KUBB v${version}`)

  const eyeTop = areEyesOpen ? colors.eye('█▀█') : colors.eye('───')
  const eyeBottom = areEyesOpen ? colors.eye('▀▀▀') : colors.eye('───')

  return `
   ${colors.lid('▄▄▄▄▄▄▄▄▄▄▄▄▄')}
  ${colors.woodTop('█             █')}
  ${colors.woodTop('█  ')}${colors.highlight('▄▄')}${colors.woodTop('     ')}${colors.highlight('▄▄')}${colors.woodTop('  █')}  ${kubbVersion}
  ${colors.woodMid('█ ')}${eyeTop}${colors.woodMid('     ')}${eyeTop}${colors.woodMid(' █')}  ${pc.gray(title)}
  ${colors.woodMid('█ ')}${eyeBottom}${colors.woodMid('  ')}${colors.blush('◡')}${colors.woodMid('  ')}${eyeBottom}${colors.woodMid(' █')}  ${pc.dim('────────────────────────')}
  ${colors.woodBase('█             █')}  ${pc.yellow('➜')} ${pc.white(description)}
   ${colors.woodBase('▀▀▀▀▀▀▀▀▀▀▀▀▀')}
`
}

/**
 * Animate the intro by blinking the mascot eyes when running in a TTY.
 * This prints a short sequence of frames, hiding the cursor while animating.
 * If stdout is not a TTY or running in CI, the function resolves immediately.
 */
export async function animateIntro({
  title,
  description,
  version,
  blinks = 5,
  interval = 500,
}: {
  title: string
  description: string
  version: string
  blinks?: number
  interval?: number
}): Promise<void> {
  // Only animate on interactive TTY and when not running in CI
  if (!process.stdout.isTTY || process.env.CI) {
    return undefined
  }


  // Helper sleep

  // Hide cursor
  // Backup original writers and console methods so we can suppress other logs while animating
  const origConsoleLog = console.log
  const origConsoleInfo = console.info
  const origConsoleWarn = console.warn
  const origConsoleError = console.error
  const origConsoleDebug = console.debug

  // Hide cursor using original writer
  process.stdout.write('\x1b[?25l')

  try {
    // Silence other logging by replacing console methods and stdout/stderr writers
    console.log = () => {}
    console.info = () => {}
    console.warn = () => {}
    console.error = () => {}
    console.debug = () => {}

    // Print initial open frame using original writer (no leading newline)
    const openFrame = getIntro({ title, description, version, areEyesOpen: true })
    process.stdout.write(`${openFrame}\n`)

    const lines = openFrame.split('\n').length

    const renderFrame = (frameStr: string) => {
      // Move cursor up to the start of the frame
      process.stdout.write(`\x1b[${lines}A`)

      const parts = frameStr.split('\n')
      for (const line of parts) {
        // Clear the line and write new content
        process.stdout.write('\x1b[2K\r')
        process.stdout.write(`${line}\n`)
      }
    }

    for (let i = 0; i < blinks; i++) {
      // blink closed
      await sleep(interval)

      renderFrame(getIntro({ title, description, version, areEyesOpen: false }))

      // short pause while closed
      await sleep(Math.round(interval * 0.9))

      // open again
      renderFrame(getIntro({ title, description, version, areEyesOpen: false }))
    }

    // leave the final (open) frame on screen
  } finally {
    // Show cursor again (use original writer)
    process.stdout.write('\x1b[?25h')

    console.log = origConsoleLog
    console.info = origConsoleInfo
    console.warn = origConsoleWarn
    console.error = origConsoleError
    console.debug = origConsoleDebug
  }
}
