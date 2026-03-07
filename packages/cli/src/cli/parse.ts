import { nodeAdapter } from './adapters/node.ts'
import type { CLIAdapter, CommandDefinition, RunOptions } from './types.ts'

/**
 * Create a CLI runner bound to a specific adapter.
 * Defaults to the built-in `nodeAdapter` (Node.js `node:util parseArgs`).
 *
 * To swap the underlying CLI engine, pass a different adapter:
 * @example
 * import { cittyAdapter } from './adapters/citty.ts'
 * const { run } = createCLI({ adapter: cittyAdapter })
 */
export function createCLI(options?: { adapter?: CLIAdapter }): {
  run(commands: CommandDefinition[], argv: string[], opts: RunOptions): Promise<void>
} {
  const adapter = options?.adapter ?? nodeAdapter

  return {
    run(commands, argv, opts) {
      return adapter.run(commands, argv, opts)
    },
  }
}
