import { styleText } from 'node:util'
import dryrun from '@gunshi/plugin-dryrun'
import { cli } from 'gunshi'
import { isDisabled as isTelemetryDisabled } from './Telemetry.ts'
import { version } from '../package.json'
import { command as generateCommand } from './commands/generate.ts'
import { command as initCommand } from './commands/init.ts'
import { command as mcpCommand } from './commands/mcp.ts'
import { command as studioCommand } from './commands/studio/index.ts'
import { command as validateCommand } from './commands/validate.ts'
import { resolveDeprecatedFlags } from './deprecatedFlags.ts'

/** Flags that short-circuit execution (help and version). The telemetry notice is suppressed for these. */
const QUIET_FLAGS = new Set<string>(['--help', '-h', '--version', '-v', '--json'])

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
  const args = resolveDeprecatedFlags(stripExecArgs(argv))
  const isQuietFlag = args.some((arg) => QUIET_FLAGS.has(arg))

  if (!isTelemetryDisabled() && !isQuietFlag) {
    console.log(
      `${styleText('yellow', 'Notice:')} Kubb collects anonymous telemetry data to help improve the tool. No personal data or file contents are collected. \nTo disable, set ${styleText('cyan', 'KUBB_DISABLE_TELEMETRY=1')}.\n`,
    )
  }

  // Each command's `run` imports its runner, so an optional peer (@kubb/adapter-oas, @kubb/mcp, @kubb/studio) loads only when it runs.
  await cli(args, generateCommand, {
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
    strict: true,
    plugins: [dryrun({ name: 'dry-run' })],
    onErrorCommand: async (_ctx, error) => {
      process.exitCode = 1
      console.error(error)
    },
  })
}
