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

type OptionTypeMap = { string: string; boolean: boolean }

type IsRequired<O extends OptionDefinition> = O['default'] extends string | boolean ? true : O['required'] extends true ? true : false

/**
 * Infers typed values from an options record. Options with a `default` or `required: true` are always defined.
 */
type InferValues<O extends Record<string, OptionDefinition>> = {
  [K in keyof O as IsRequired<O[K]> extends true ? K : never]: OptionTypeMap[O[K]['type']]
} & {
  [K in keyof O as IsRequired<O[K]> extends true ? never : K]?: OptionTypeMap[O[K]['type']]
}

/**
 * Returns a `CommandDefinition` with typed `values` in `run()`.
 * The callback receives `values` inferred from the declared options — no casts needed.
 *
 * @example
 * ```ts
 * const generate = defineCommand({
 *   name: 'generate',
 *   description: 'Generate client code',
 *   options: { config: { type: 'string', description: 'Config path' } },
 *   async run({ values }) { console.log(values.config) },
 * })
 * ```
 */
export function defineCommand<O extends Record<string, OptionDefinition>>(def: {
  name: string
  description: string
  arguments?: Array<string>
  examples?: Array<string>
  options?: O
  subCommands?: Array<CommandDefinition>
  run?: (args: { values: InferValues<O>; positionals: Array<string> }) => Promise<void>
}): CommandDefinition {
  const { run, ...rest } = def
  if (!run) return rest
  return {
    ...rest,
    run: (args) =>
      run({
        values: args.values as InferValues<O>,
        positionals: args.positionals,
      }),
  }
}
