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
  ${colors.woodTop('█  ')}${colors.highlight('▄▄')}${colors.woodTop('     ')}${colors.highlight('▄▄')}${colors.woodTop('  █')}  ${kubbVersion}
  ${colors.woodMid('█ ')}${eyeTop}${colors.woodMid('     ')}${eyeTop}${colors.woodMid(' █')}  ${pc.gray(title)}
  ${colors.woodMid('█ ')}${eyeBottom}${colors.woodMid('  ')}${colors.blush('◡')}${colors.woodMid('  ')}${eyeBottom}${colors.woodMid(' █')}  ${pc.yellow('➜')} ${pc.white(description)}
   ${colors.woodBase('▀▀▀▀▀▀▀▀▀▀▀▀▀')}
`
}
