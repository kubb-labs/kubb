import { styleText } from 'node:util'
import { createCLI } from '@internals/utils'
import { version } from '../package.json'
import { QUITE_FLAGS } from './constants.ts'
import { isFlag } from './utils/flags.ts'
import { isTelemetryDisabled } from './utils/telemetry.ts'

const cli = createCLI()

function shouldShowTelemetryNotice(argv: Array<string>): boolean {
  if (isTelemetryDisabled()) {
    return false
  }
  // Skip when the user is just asking for help or version info
  if (argv.some((arg) => isFlag(QUITE_FLAGS, arg))) {
    return false
  }
  // Skip in non-interactive / scripting contexts
  if (!process.stdout.isTTY) {
    return false
  }
  return true
}

export async function run(argv: Array<string> = process.argv): Promise<void> {
  if (shouldShowTelemetryNotice(argv)) {
    console.log(
      `${styleText('yellow', 'Notice:')} Kubb collects anonymous telemetry data to help improve the tool. No personal data or file contents are collected. \nTo disable, set ${styleText('cyan', 'KUBB_DISABLE_TELEMETRY=1')}.\n`,
    )
  }

  const [{ command: generateCommand }, { command: validateCommand }, { command: mcpCommand }, { command: agentCommand }, { command: initCommand }] =
    await Promise.all([
      import('./commands/generate.ts'),
      import('./commands/validate.ts'),
      import('./commands/mcp.ts'),
      import('./commands/agent.ts'),
      import('./commands/init.ts'),
    ])

  await cli.run([generateCommand, validateCommand, mcpCommand, agentCommand, initCommand], argv, {
    programName: 'kubb',
    defaultCommandName: 'generate',
    version,
  })
}
