import { styleText } from 'node:util'
import dryrun from '@gunshi/plugin-dryrun'
import { cli } from 'gunshi'
import { isDisabled as isTelemetryDisabled } from './Telemetry.ts'
import { version } from '../package.json'
import { getBanner, wantsMascot } from './ui/mascot.ts'
import { command as generateCommand } from './commands/generate.ts'
import { resolveDeprecatedFlags } from './deprecatedFlags.ts'

/** The subcommands besides `generate`, imported only when the run needs them, so `kubb generate` never loads their code. */
const commandLoaders = {
  init: () => import('./runners/init/run.ts'),
  validate: () => import('./commands/validate.ts'),
  mcp: () => import('./commands/mcp.ts'),
  studio: () => import('./commands/studio/index.ts'),
  add: () => import('./runners/add/run.ts'),
  update: () => import('./runners/update/run.ts'),
  remove: () => import('./runners/remove/run.ts'),
  list: () => import('./runners/list/run.ts'),
} as const

type CommandName = keyof typeof commandLoaders

/** Flags that print the root help, which lists every subcommand. */
const HELP_FLAGS = new Set<string>(['--help', '-h'])

/** Flags that short-circuit execution (help and version). The telemetry notice is suppressed for these. */
const QUIET_FLAGS = new Set<string>(['--help', '-h', '--version', '-v', '--json'])

/**
 * Entry point for the `kubb` CLI. Prints the telemetry notice unless telemetry is disabled or a
 * quiet flag is passed, then runs the given command, or `generate` when none is given.
 */
export async function run(argv: Array<string> = process.argv.slice(2)): Promise<void> {
  const resolvedArgs = resolveDeprecatedFlags(argv)
  // gunshi reads the command from the first argument that is not a flag, so `kubb -s list` runs `list`.
  const name = resolvedArgs.find((arg) => !arg.startsWith('-')) ?? ''
  // The named subcommand alone; every one for the root help; none otherwise, since an unknown first argument falls back to `generate`.
  let names: Array<CommandName> = []
  if (Object.hasOwn(commandLoaders, name)) names = [name as CommandName]
  if (!names.length && resolvedArgs.some((arg) => HELP_FLAGS.has(arg))) names = Object.keys(commandLoaders) as Array<CommandName>
  const modules = Object.fromEntries(await Promise.all(names.map(async (key) => [key, await commandLoaders[key]()] as const)))
  // Already loaded above, so this import only reads the module cache.
  const args = name === 'studio' ? (await import('./commands/studio/index.ts')).routeStudioFlags(resolvedArgs) : resolvedArgs
  const isQuietFlag = args.some((arg) => QUIET_FLAGS.has(arg))
  // `--reporter json` and `--json` own stdout, so the header must not land there.
  const isJsonOutput =
    args.includes('--json') || args.some((arg, index) => /^--reporter=.*\bjson\b/.test(arg) || (arg === '--reporter' && /\bjson\b/.test(args[index + 1] ?? '')))

  // stderr, so the notice never lands in a stream a client parses, such as `kubb mcp` stdio.
  if (!isTelemetryDisabled() && !isQuietFlag) {
    console.error(
      `${styleText('yellow', 'Notice:')} Kubb collects anonymous telemetry data to help improve the tool. No personal data or file contents are collected. \nTo disable, set ${styleText('cyan', 'KUBB_DISABLE_TELEMETRY=1')}.\n`,
    )
  }

  // validate, mcp and studio also import their runner when they run, so an optional peer (@kubb/adapter-oas, @kubb/mcp, @kubb/studio) loads only then.
  await cli(args, generateCommand, {
    name: 'kubb',
    version,
    // Not `generateCommand.description`: gunshi prints this on every subcommand's help too, so
    // `kubb studio --help` would open with a paragraph about generating types.
    description: 'Generate code from an OpenAPI specification, manage Kubb extensions, or connect the project to Kubb Studio.',
    subCommands: {
      generate: generateCommand,
      ...Object.fromEntries(Object.entries(modules).map(([key, module]) => [key, module.command])),
    },
    fallbackToEntry: true,
    // The mascot opens only the long-running commands; `generate` turns this off and plays its animated banner instead.
    renderHeader: isJsonOutput
      ? null
      : async (ctx) => {
          if (!wantsMascot({ commandPath: ctx.commandPath, values: ctx.values })) return ''

          // Gunshi adds a blank line after returned headers; the first prompt already supplies its guide.
          ctx.log(getBanner(version, ctx.commandPath.join(' ') || 'generate'))
          return ''
        },
    strict: true,
    plugins: [dryrun({ name: 'dry-run' })],
    onErrorCommand: async (_ctx, error) => {
      process.exitCode = 1
      console.error(error)
    },
  })
}
