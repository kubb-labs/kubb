import { styleText } from 'node:util'
import { createCLI } from '@internals/utils'
import { Telemetry } from './Telemetry.ts'
import { version } from '../package.json'
import { QUIET_FLAGS } from './constants.ts'

const cli = createCLI()
export async function run(argv: Array<string> = process.argv): Promise<void> {
  const isQuietFlag = argv.some((arg) => QUIET_FLAGS.has(arg))

  if (!Telemetry.isDisabled && !isQuietFlag) {
    console.log(
      `${styleText('yellow', 'Notice:')} Kubb collects anonymous telemetry data to help improve the tool. No personal data or file contents are collected. \nTo disable, set ${styleText('cyan', 'KUBB_DISABLE_TELEMETRY=1')}.\n`,
    )
  }

  const { command: generateCommand } = await import('./commands/generate.ts')
  const { command: validateCommand } = await import('./commands/validate.ts')
  const { command: mcpCommand } = await import('./commands/mcp.ts')
  const { command: initCommand } = await import('./commands/init.ts')

  await cli.run([generateCommand, validateCommand, mcpCommand, initCommand], argv, {
    programName: 'kubb',
    defaultCommandName: 'generate',
    version,
  })
}
