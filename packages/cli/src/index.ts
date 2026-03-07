import { styleText } from 'node:util'
import { version } from '../package.json'
import { createCLI } from './cli/index.ts'
import { isTelemetryDisabled } from './utils/telemetry.ts'

const cli = createCLI()

export async function run(argv: string[] = process.argv): Promise<void> {
  if (!isTelemetryDisabled()) {
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
