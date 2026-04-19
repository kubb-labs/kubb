import { nodeAdapter } from "./adapters/nodeAdapter.ts";
import type { CLIAdapter, CommandDefinition, RunOptions } from "./types.ts";

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
  run(
    commands: CommandDefinition[],
    argv: string[],
    opts: RunOptions,
  ): Promise<void>;
} {
  const adapter = options?.adapter ?? nodeAdapter;

  return {
    run(commands, argv, opts) {
      return adapter.run(commands, argv, opts);
    },
  };
}
