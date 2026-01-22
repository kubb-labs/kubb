import { default as gradientString } from 'gradient-string'
import { hex,} from './ansiColors.ts'
import pc from "picocolors";

/**
 * Generates the Kubb mascot face welcome message
 * @param version - The version string to display
 * @returns Formatted mascot face string
 */
export function getIntro({title, description, version}:{ title: string; description:string; version: string}): string {
  // Custom Color Palette for "Wooden" Depth
  const colors = {
    lid: hex('#F55A17'), // Dark Wood
    woodTop: hex('#F5A217'), // Bright Orange (Light source)
    woodMid: hex('#F58517'), // Main Orange
    woodBase: hex('#B45309'), // Shadow Orange
    eye: hex('#adadc6'),       // Deep Slate
    highlight: hex('#FFFFFF'),  // Eye shine
    blush: hex('#FDA4AF'), // Soft Rose
  }

  // Use gradient-string for the KUBB version text
  const kubbVersion = gradientString(['#F58517', '#F5A217', '#F55A17'])(`KUBB v${version}`)

  return `
   ${colors.lid('▄▄▄▄▄▄▄▄▄▄▄▄▄')}
  ${colors.woodTop('█             █')}
  ${colors.woodTop('█  ')}${colors.highlight('▄▄')}${colors.woodTop('     ')}${colors.highlight('▄▄')}${colors.woodTop('  █')}  ${kubbVersion}
  ${colors.woodMid('█ ')}${colors.eye('█▀█')}${colors.woodMid('     ')}${colors.eye('█▀█')}${colors.woodMid(' █')}  ${pc.gray(title)}
  ${colors.woodMid('█ ')}${colors.eye('▀▀▀')}${colors.woodMid('  ')}${colors.blush('◡')}${colors.woodMid('  ')}${colors.eye('▀▀▀')}${colors.woodMid(' █')}  ${pc.dim('────────────────────────')}
  ${colors.woodBase('█             █')}  ${pc.yellow('➜')} ${pc.white(description)}
   ${colors.woodBase('▀▀▀▀▀▀▀▀▀▀▀▀▀')}
`;

}


