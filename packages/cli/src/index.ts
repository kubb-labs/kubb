import { styleText } from 'node:util'
import { version } from '../package.json'
import { dispatch, getCommandSchema, defineCommand } from './cli/index.ts'
import { isTelemetryDisabled } from './utils/telemetry.ts'

import { command as generateCommand } from './commands/generate.ts'
import { command as validateCommand } from './commands/validate.ts'
import { command as mcpCommand } from './commands/mcp.ts'
import { command as agentCommand } from './commands/agent.ts'
import { command as initCommand } from './commands/init.ts'

const commands = [generateCommand, validateCommand, mcpCommand, agentCommand, initCommand]

export async function run(argv: string[] = process.argv): Promise<void> {
  if (!isTelemetryDisabled()) {
    console.log(
      `${styleText('yellow', 'Notice:')} Kubb collects anonymous telemetry data to help improve the tool. No personal data or file contents are collected. \nTo disable, set ${styleText('cyan', 'KUBB_DISABLE_TELEMETRY=1')}.\n`,
    )
  }

  await dispatch(commands, argv, {
    programName: 'kubb',
    defaultCommandName: 'generate',
    version,
  })
}

export { getCommandSchema, defineCommand, commands }
