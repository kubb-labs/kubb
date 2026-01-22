import { default as gradientString } from 'gradient-string'
import { dim, gray, hex, white, yellow } from './ansiColors.ts'

/**
 * Generates the Kubb mascot face welcome message
 * @param version - The version string to display
 * @returns Formatted mascot face string
 */
export function getMascotFace(version: string): string {
  // Custom Color Palette for "Wooden" Depth
  const colors = {
    lid: hex('#78350F'), // Dark Wood
    woodTop: hex('#F59E0B'), // Bright Orange (Light source)
    woodMid: hex('#D97706'), // Main Orange
    woodBase: hex('#B45309'), // Shadow Orange
    eye: hex('#1F2937'), // Deep Slate
    highlight: hex('#FFFFFF'), // Eye shine
    blush: hex('#FDA4AF'), // Soft Rose
  }

  // Use gradient-string for the KUBB version text
  const kubbVersion = gradientString(['#F58517', '#F5A217', '#F55A17'])(`KUBB v${version}`)

  return `
   ${colors.lid('█████████████')}
  ${colors.woodTop('█             █')}
  ${colors.woodTop('█  ')}${colors.highlight('██')}${colors.woodTop('     ')}${colors.highlight('██')}${colors.woodTop('  █')}  ${kubbVersion}
  ${colors.woodMid('█ ')}${colors.eye('███')}${colors.woodMid('     ')}${colors.eye('███')}${colors.woodMid(' █')}  ${gray('The wood-powered toolkit')}
  ${colors.woodMid('█ ')}${colors.eye('███')}${colors.woodMid('  ')}${colors.blush('●')}${colors.woodMid('  ')}${colors.eye('███')}${colors.woodMid(' █')}  ${dim('────────────────────────')}
  ${colors.woodBase('█             █')}  ${yellow('▸')} ${white('Ready to generate.')}
   ${colors.woodBase('█████████████')}`
}
