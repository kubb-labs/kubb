import process from 'node:process'
import { defineCommand } from '@internals/utils'

export const command = defineCommand({
  name: 'generate',
  description:
    'Generate TypeScript types, API clients, React Query hooks, Zod schemas, and more from an OpenAPI specification. Reads kubb.config.ts by default. Pass an OpenAPI file path as the first argument to override the input without editing the config.',
  arguments: ['[input]'],
  examples: ['kubb generate', 'kubb generate ./openapi.yaml', 'kubb generate --config kubb.config.ts', 'kubb generate --watch'],
  options: {
    config: {
      type: 'string',
      description: 'Path to the Kubb config',
      short: 'c',
    },
    logLevel: {
      type: 'string',
      description: 'Info, silent, verbose or debug',
      short: 'l',
      default: 'info',
      hint: 'silent|info|verbose|debug',
      enum: ['silent', 'info', 'verbose', 'debug'],
    },
    watch: {
      type: 'boolean',
      description: 'Watch mode based on the input file',
      short: 'w',
      default: false,
    },
    debug: {
      type: 'boolean',
      description: 'Override logLevel to debug',
      short: 'd',
      default: false,
    },
    verbose: {
      type: 'boolean',
      description: 'Override logLevel to verbose',
      short: 'v',
      default: false,
    },
    silent: {
      type: 'boolean',
      description: 'Override logLevel to silent',
      short: 's',
      default: false,
    },
    tui: {
      type: 'boolean',
      description: 'Render the full-screen opentui dashboard (Bun + TTY only)',
      default: false,
    },
  },
  async run({ values, positionals }) {
    const logLevel = values.debug ? 'debug' : values.verbose ? 'verbose' : values.silent ? 'silent' : values.logLevel
    const { run } = await import('../runners/generate/run.ts')

    await run({
      input: positionals[0],
      configPath: values.config,
      logLevel,
      watch: values.watch,
      tui: values.tui || process.env.KUBB_TUI === '1',
    })
  },
})
