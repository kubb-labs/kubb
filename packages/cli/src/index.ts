import { styleText } from 'node:util'
import dryrun from '@gunshi/plugin-dryrun'
import { cli } from 'gunshi'
import { isDisabled as isTelemetryDisabled } from './Telemetry.ts'
import { version } from '../package.json'
import { command as generateCommand } from './commands/generate.ts'
import { command as mcpCommand } from './commands/mcp.ts'
import { command as studioCommand, routeStudioFlags } from './commands/studio/index.ts'
import { command as validateCommand } from './commands/validate.ts'
import { resolveDeprecatedFlags } from './deprecatedFlags.ts'
import { command as addCommand } from './runners/add/run.ts'
import { command as initCommand } from './runners/init/run.ts'
import { command as listCommand } from './runners/list/run.ts'
import { command as updateCommand } from './runners/update/run.ts'

/** Flags that short-circuit execution (help and version). The telemetry notice is suppressed for these. */
const QUIET_FLAGS = new Set<string>(['--help', '-h', '--version', '-v', '--json'])

/**
 * Entry point for the `kubb` CLI. Prints the telemetry notice unless telemetry is disabled or a
 * quiet flag is passed, then runs the given command, or `generate` when none is given.
 */
export async function run(argv: Array<string> = process.argv.slice(2)): Promise<void> {
  const args = routeStudioFlags(resolveDeprecatedFlags(argv))
  const isQuietFlag = args.some((arg) => QUIET_FLAGS.has(arg))
  // `--reporter json` owns stdout, so gunshi's header line must not land there.
  const isJsonReporter = args.some((arg, index) => /^--reporter=.*\bjson\b/.test(arg) || (arg === '--reporter' && /\bjson\b/.test(args[index + 1] ?? '')))

  // stderr, so the notice never lands in a stream a client parses, such as `kubb mcp` stdio.
  if (!isTelemetryDisabled() && !isQuietFlag) {
    console.error(
      `${styleText('yellow', 'Notice:')} Kubb collects anonymous telemetry data to help improve the tool. No personal data or file contents are collected. \nTo disable, set ${styleText('cyan', 'KUBB_DISABLE_TELEMETRY=1')}.\n`,
    )
  }

  // validate, mcp and studio import their runner when they run, so an optional peer (@kubb/adapter-oas, @kubb/mcp, @kubb/studio) loads only then.
  await cli(args, generateCommand, {
    name: 'kubb',
    version,
    // Not `generateCommand.description`: gunshi prints this on every subcommand's help too, so
    // `kubb studio --help` would open with a paragraph about generating types.
    description: 'Generate code from an OpenAPI specification, manage Kubb extensions, or connect the project to Kubb Studio.',
    subCommands: {
      generate: generateCommand,
      init: initCommand,
      validate: validateCommand,
      mcp: mcpCommand,
      studio: studioCommand,
      add: addCommand,
      update: updateCommand,
      list: listCommand,
    },
    fallbackToEntry: true,
    ...(isJsonReporter ? { renderHeader: null } : {}),
    strict: true,
    plugins: [dryrun({ name: 'dry-run' })],
    onErrorCommand: async (_ctx, error) => {
      process.exitCode = 1
      console.error(error)
    },
  })
}
