import { parseArgs, styleText } from 'node:util'
import { renderHelp } from './help.ts'
import type { CommandDefinition, OptionType, ParsedArgs } from './types.ts'

type ParseOption = { type: OptionType; short?: string; default?: string | boolean }
type ParseOptions = Record<string, ParseOption>

/**
 * Build the `options` map required by `node:util parseArgs` from a
 * `CommandDefinition`'s option declarations.
 */
function buildParseOptions(def: CommandDefinition): ParseOptions {
  const result: ParseOptions = {
    help: { type: 'boolean', short: 'h' },
  }

  for (const [name, opt] of Object.entries(def.options ?? {})) {
    result[name] = {
      type: opt.type,
      ...(opt.short ? { short: opt.short } : {}),
      ...(opt.default !== undefined ? { default: opt.default } : {}),
    }
  }

  return result
}

/**
 * Dispatch `argv` (raw process.argv slice after the binary path) to the
 * matching `CommandDefinition`, falling back to `defaultCommandName` when
 * no recognized subcommand is present.
 *
 * Supports one level of nesting (e.g. `kubb agent start …`).
 */
export async function dispatch(
  defs: CommandDefinition[],
  argv: string[],
  opts: {
    programName: string
    defaultCommandName: string
    version: string
  },
): Promise<void> {
  const { programName, defaultCommandName, version } = opts

  // Strip leading node / binary entries when full process.argv is passed
  const args = argv.length >= 2 && argv[0]?.includes('node') ? argv.slice(2) : argv

  // ── Top-level --version / -v ────────────────────────────────────────────────
  if (args[0] === '--version' || args[0] === '-v') {
    console.log(version)
    process.exit(0)
  }

  // ── Top-level --help / -h (no subcommand token) ─────────────────────────────
  if (args[0] === '--help' || args[0] === '-h') {
    printRootHelp(programName, version, defs)
    process.exit(0)
  }

  // ── No arguments → fall through to default command ───────────────────────────
  if (args.length === 0) {
    const defaultDef = defs.find((d) => d.name === defaultCommandName)
    if (defaultDef?.run) {
      await defaultDef.run({ values: {}, positionals: [] })
    } else {
      printRootHelp(programName, version, defs)
    }
    return
  }

  // ── Resolve the command to run ───────────────────────────────────────────────
  const [first, ...rest] = args
  const isKnownSubcommand = defs.some((d) => d.name === first)

  let def: CommandDefinition | undefined
  let commandArgv: string[]
  let parentName: string | undefined

  if (isKnownSubcommand) {
    def = defs.find((d) => d.name === first)
    commandArgv = rest
    parentName = programName
  } else {
    // Default: treat the whole args list as input to the default command
    def = defs.find((d) => d.name === defaultCommandName)
    commandArgv = args
    parentName = programName
  }

  if (!def) {
    console.error(`Unknown command: ${first}`)
    printRootHelp(programName, version, defs)
    process.exit(1)
  }

  // ── Handle subcommands (one level deep, e.g. `agent start …`) ───────────────
  if (def.subCommands?.length) {
    const [subName, ...subRest] = commandArgv
    const subDef = def.subCommands.find((s) => s.name === subName)

    if (subName === '--help' || subName === '-h') {
      renderHelp(def, parentName)
      process.exit(0)
    }

    if (!subDef) {
      renderHelp(def, parentName)
      process.exit(subName ? 1 : 0)
    }

    await runCommand(subDef, subRest, `${parentName} ${def.name}`)
    return
  }

  await runCommand(def, commandArgv, parentName)
}

async function runCommand(def: CommandDefinition, argv: string[], parentName?: string): Promise<void> {
  const parseOptions = buildParseOptions(def)

  let parsed: ParsedArgs
  try {
    const result = parseArgs({
      args: argv,
      options: parseOptions,
      allowPositionals: true,
      strict: false,
    })
    parsed = { values: result.values as ParsedArgs['values'], positionals: result.positionals }
  } catch {
    renderHelp(def, parentName)
    process.exit(1)
  }

  if (parsed.values['help']) {
    renderHelp(def, parentName)
    process.exit(0)
  }

  if (!def.run) {
    renderHelp(def, parentName)
    process.exit(0)
  }

  await def.run(parsed)
}

function printRootHelp(programName: string, version: string, defs: CommandDefinition[]): void {
  console.log(`\n${styleText('bold', 'Usage:')} ${programName} <command> [options]\n`)
  console.log(`  Kubb generation — v${version}\n`)
  console.log(styleText('bold', 'Commands:'))
  for (const def of defs) {
    console.log(`  ${styleText('cyan', def.name.padEnd(16))}${def.description}`)
  }
  console.log()
  console.log(styleText('bold', 'Options:'))
  console.log(`  ${styleText('cyan', '-v, --version'.padEnd(30))}Show version number`)
  console.log(`  ${styleText('cyan', '-h, --help'.padEnd(30))}Show help`)
  console.log()
  console.log(`Run ${styleText('cyan', `${programName} <command> --help`)} for command-specific help.\n`)
}
