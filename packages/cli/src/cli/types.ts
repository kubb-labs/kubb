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
 * Define a CLI command with full type inference.
 * A thin identity wrapper that provides TypeScript inference without requiring
 * an explicit `: CommandDefinition` annotation on every command export.
 */
export function defineCommand(def: CommandDefinition): CommandDefinition {
  return def
}

export type OptionSchema = {
  name: string
  flags: string
  type: OptionType
  description: string
  default?: string | boolean
  hint?: string
  required?: boolean
}

export type CommandSchema = {
  name: string
  description: string
  arguments?: string[]
  options: OptionSchema[]
  subCommands: CommandSchema[]
}
