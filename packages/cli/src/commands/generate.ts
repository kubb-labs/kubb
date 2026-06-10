import { defineCommand } from '@internals/utils'
import type { ReporterName } from '@kubb/core'

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
      description: 'Info, silent or verbose',
      short: 'l',
      default: 'info',
      hint: 'silent|info|verbose',
      enum: ['silent', 'info', 'verbose'],
    },
    watch: {
      type: 'boolean',
      description: 'Watch mode based on the input file',
      short: 'w',
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
    reporter: {
      type: 'string',
      description: 'Reporters that render the run, comma-separated. Overrides config.reporters',
      hint: 'cli|json|file',
      enum: ['cli', 'json', 'file'],
    },
    'no-cache': {
      type: 'boolean',
      description: 'Disable the incremental build cache and force a full regeneration',
      default: false,
    },
  },
  async run({ values, positionals }) {
    const logLevel = values.verbose ? 'verbose' : values.silent ? 'silent' : values.logLevel
    const reporters = values.reporter
      ?.split(',')
      .map((name) => name.trim())
      .filter(Boolean) as Array<ReporterName> | undefined
    const { run } = await import('../runners/generate/run.ts')

    await run({
      input: positionals[0],
      configPath: values.config,
      logLevel,
      watch: values.watch,
      reporters,
      noCache: values['no-cache'],
    })
  },
})
