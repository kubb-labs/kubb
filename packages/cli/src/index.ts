import { styleText } from 'node:util'
import { cli, lazy } from 'gunshi'
import { isDisabled as isTelemetryDisabled } from './Telemetry.ts'
import { version } from '../package.json'
import { QUIET_FLAGS } from './constants.ts'

/**
 * Strips the leading executable + script entries when `process.argv` is passed directly.
 * Handles Node.js (`/usr/bin/node`), Bun (`/usr/local/bin/bun`), Deno, tsx, etc. All runtime
 * executable paths contain a path separator; bare command names do not.
 */
function stripExecArgs(argv: Array<string>): Array<string> {
  const firstArgIsExecutablePath = (argv[0]?.includes('/') || argv[0]?.includes('\\')) ?? false
  return argv.length >= 2 && firstArgIsExecutablePath ? argv.slice(2) : argv
}

/**
 * Entry point for the `kubb` CLI. Prints the telemetry notice unless telemetry is disabled or a
 * quiet flag is passed, then runs the generate, validate, mcp, studio, and init commands. Defaults to
 * `generate` when no command is given.
 */
export async function run(argv: Array<string> = process.argv): Promise<void> {
  const isQuietFlag = argv.some((arg) => QUIET_FLAGS.has(arg))

  if (!isTelemetryDisabled() && !isQuietFlag) {
    console.log(
      `${styleText('yellow', 'Notice:')} Kubb collects anonymous telemetry data to help improve the tool. No personal data or file contents are collected. \nTo disable, set ${styleText('cyan', 'KUBB_DISABLE_TELEMETRY=1')}.\n`,
    )
  }

  const { command: generateCommand } = await import('./commands/generate.ts')
  const { command: validateCommand } = await import('./commands/validate.ts')
  const { command: mcpCommand } = await import('./commands/mcp.ts')
  const { definition: studioDefinition } = await import('./commands/studio.ts')
  // The runner pulls in @kubb/studio, an optional peer, so it loads only when `kubb studio` runs.
  const studioCommand = lazy(async () => (await import('./runners/studio/run.ts')).runner, studioDefinition)
  const { command: initCommand } = await import('./commands/init.ts')

  try {
    await cli(stripExecArgs(argv), generateCommand, {
      name: 'kubb',
      version,
      // Not `generateCommand.description`: gunshi prints this on every subcommand's help too, so
      // `kubb studio --help` would open with a paragraph about generating types.
      description: 'Generate code from an OpenAPI specification, or connect the project to Kubb Studio.',
      subCommands: {
        generate: generateCommand,
        init: initCommand,
        validate: validateCommand,
        mcp: mcpCommand,
        studio: studioCommand,
      },
      fallbackToEntry: true,
    })
  } catch {
    process.exit(1)
  }
}
