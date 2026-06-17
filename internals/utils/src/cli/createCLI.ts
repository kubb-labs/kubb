import { nodeAdapter } from './adapters/nodeAdapter.ts'
import type { CommandDefinition } from './defineCommand.ts'

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
 * Creates a CLI runner bound to a specific adapter.
 *
 * @default nodeAdapter (Node.js `node:util parseArgs`)
 *
 * @example
 * ```ts
 * await createCLI().run(commands, process.argv.slice(2), {
 *   programName: 'kubb',
 *   defaultCommandName: 'generate',
 *   version: '5.0.0',
 * })
 * ```
 */
export function createCLI(options?: { adapter?: CLIAdapter }): {
  run(commands: Array<CommandDefinition>, argv: Array<string>, opts: RunOptions): Promise<void>
} {
  const adapter = options?.adapter ?? nodeAdapter

  return {
    run(commands, argv, opts) {
      return adapter.run(commands, argv, opts)
    },
  }
}
