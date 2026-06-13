type BaseOption = {
  /**
   * Single-character short alias, e.g. `'c'` for `--config`.
   */
  short?: string
  description: string
  hint?: string
  required?: boolean
  /**
   * Allowed values for string options. Used in help output and AI/MCP tool schemas.
   */
  enum?: Array<string>
}

type StringOption = BaseOption & { type: 'string'; default?: string }
type BooleanOption = BaseOption & { type: 'boolean'; default?: boolean }

/**
 * A single CLI option — either a string value or a boolean flag.
 */
export type OptionDefinition = StringOption | BooleanOption

/**
 * The primitive type of a CLI option value.
 */
export type OptionType = OptionDefinition['type']

/**
 * Parsed result of `parseArgs` — typed values map plus positional arguments.
 */
export type ParsedArgs = {
  values: Record<string, string | boolean | undefined>
  positionals: Array<string>
}

/**
 * Full definition of a CLI command including its options, sub-commands, and run handler.
 */
export type CommandDefinition = {
  name: string
  description: string
  /**
   * Positional argument labels shown in usage line, e.g. `['[input]']`.
   */
  arguments?: Array<string>
  /**
   * Usage examples shown in help output and exposed to AI/MCP tools.
   */
  examples?: Array<string>
  options?: Record<string, OptionDefinition>
  subCommands?: Array<CommandDefinition>
  run?: (args: ParsedArgs) => Promise<void>
}

/**
 * Options passed to every `CLIAdapter.run` invocation.
 */
export type RunOptions = {
  programName: string
  defaultCommandName: string
  version: string
}

/**
 * Interface a CLI adapter must implement to plug into `createCLI`.
 */
export type CLIAdapter = {
  run(commands: Array<CommandDefinition>, argv: Array<string>, opts: RunOptions): Promise<void>
  renderHelp(def: CommandDefinition, parentName?: string): void
}

/**
 * JSON-serializable representation of a single CLI option, used by `getCommandSchema`.
 */
export type OptionSchema = {
  name: string
  flags: string
  type: OptionType
  description: string
  default?: string | boolean
  hint?: string
  required?: boolean
  enum?: Array<string>
}

/**
 * JSON-serializable representation of a command and all its options/sub-commands.
 */
export type CommandSchema = {
  name: string
  description: string
  arguments?: Array<string>
  examples?: Array<string>
  options: Array<OptionSchema>
  subCommands: Array<CommandSchema>
}
