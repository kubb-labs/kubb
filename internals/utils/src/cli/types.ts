type BaseOption = {
  /** Single-character short alias, e.g. `'c'` for `--config`. */
  short?: string
  description: string
  hint?: string
  required?: boolean
  /** Allowed values for string options. Used in help output and AI/MCP tool schemas. */
  enum?: string[]
}

export type StringOption = BaseOption & { type: 'string'; default?: string }
export type BooleanOption = BaseOption & { type: 'boolean'; default?: boolean }
export type OptionDefinition = StringOption | BooleanOption
export type OptionType = OptionDefinition['type']

export type ParsedArgs = {
  values: Record<string, string | boolean | undefined>
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

export type RunOptions = {
  programName: string
  defaultCommandName: string
  version: string
}

export type CLIAdapter = {
  run(commands: CommandDefinition[], argv: string[], opts: RunOptions): Promise<void>
  renderHelp(def: CommandDefinition, parentName?: string): void
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
