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

type OptionTypeMap = { string: string; boolean: boolean }

type IsRequired<O extends OptionDefinition> = O['default'] extends string | boolean ? true : O['required'] extends true ? true : false

/** Infers typed values from an options record. Options with a `default` or `required: true` are always defined. */
type InferValues<O extends Record<string, OptionDefinition>> = {
  [K in keyof O as IsRequired<O[K]> extends true ? K : never]: OptionTypeMap[O[K]['type']]
} & {
  [K in keyof O as IsRequired<O[K]> extends true ? never : K]?: OptionTypeMap[O[K]['type']]
}

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

/**
 * Returns a `CommandDefinition` with typed `values` in `run()`.
 * The callback receives `values` typed from the declared options — no casts needed.
 */
export function defineCommand<O extends Record<string, OptionDefinition>>(def: {
  name: string
  description: string
  arguments?: string[]
  options?: O
  subCommands?: CommandDefinition[]
  run?: (args: { values: InferValues<O>; positionals: string[] }) => Promise<void>
}): CommandDefinition {
  const { run, ...rest } = def
  if (!run) return rest
  return {
    ...rest,
    run: (args) => run({ values: args.values as InferValues<O>, positionals: args.positionals }),
  }
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

/** Returns a `CLIAdapter` with type inference. Pass a different adapter to `createCLI` to swap the CLI engine. */
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
