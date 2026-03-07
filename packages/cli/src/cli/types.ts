export type OptionType = 'string' | 'boolean'

export type OptionDefinition = {
  /** `'string'` or `'boolean'` — maps directly to `node:util parseArgs` option types. */
  type: OptionType
  /** Single-character short alias, e.g. `'c'` for `--config`. */
  short?: string
  description: string
  default?: string | boolean
  /** Value placeholder shown in help, e.g. `'silent|info|verbose|debug'`. */
  hint?: string
  required?: boolean
  /** Allowed values for string options. Used in help output and AI/MCP tool schemas. */
  enum?: string[]
}

export type ParsedArgs = {
  values: Record<string, string | boolean | string[] | undefined>
  positionals: string[]
}

export type CommandDefinition = {
  name: string
  description: string
  /** Positional argument labels shown in usage line, e.g. `['[input]']`. */
  arguments?: string[]
  options?: Record<string, OptionDefinition>
  subCommands?: CommandDefinition[]
  run?: (args: ParsedArgs) => Promise<void>
}

/**
 * Returns a `CommandDefinition` with type inference.
 * Use instead of an explicit `: CommandDefinition` annotation.
 */
export function defineCommand(def: CommandDefinition): CommandDefinition {
  return def
}

export type RunOptions = {
  programName: string
  defaultCommandName: string
  version: string
}

export type CLIAdapter = {
  run(commands: CommandDefinition[], argv: string[], opts: RunOptions): Promise<void>
  renderHelp(def: CommandDefinition, parentName?: string): void
}

/**
 * Returns a `CLIAdapter` with type inference.
 * Pass a different adapter to `createCLI` to swap the CLI engine.
 */
export function defineCLIAdapter(adapter: CLIAdapter): CLIAdapter {
  return adapter
}

export type OptionSchema = {
  name: string
  flags: string
  type: OptionType
  description: string
  default?: string | boolean
  hint?: string
  required?: boolean
  enum?: string[]
}

export type CommandSchema = {
  name: string
  description: string
  arguments?: string[]
  options: OptionSchema[]
  subCommands: CommandSchema[]
}
