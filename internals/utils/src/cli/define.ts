import type { CLIAdapter, CommandDefinition, OptionDefinition } from './types.ts'

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
 * Returns a `CLIAdapter` as-is with full type inference. Pass a custom adapter to `createCLI` to swap the CLI engine.
 *
 * @example
 * ```ts
 * const adapter = defineCLIAdapter({ run: myRun, renderHelp: myHelp })
 * createCLI({ adapter }).run(commands, argv, opts)
 * ```
 */
export function defineCLIAdapter(adapter: CLIAdapter): CLIAdapter {
  return adapter
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
