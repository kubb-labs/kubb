import { define } from 'gunshi'
import type { ReporterName } from '@kubb/core'

const REPORTER_NAMES: Array<ReporterName> = ['cli', 'json', 'file']

/**
 * Splits and validates the comma-separated `--reporter` value against the known reporter names.
 */
function parseReporters(value: string): Array<ReporterName> {
  const names = value
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)

  for (const name of names) {
    if (!REPORTER_NAMES.includes(name as ReporterName)) {
      throw new Error(`must be one of cli, json, file (got "${name}")`)
    }
  }

  return names as Array<ReporterName>
}

export const command = define({
  name: 'generate',
  description:
    'Generate TypeScript types, API clients, React Query hooks, Zod schemas, and more from an OpenAPI specification. Reads kubb.config.ts by default. Pass an OpenAPI file path as the first argument to override the input without editing the config.',
  examples: ['kubb generate', 'kubb generate ./openapi.yaml', 'kubb generate --config kubb.config.ts', 'kubb generate --watch'].join('\n'),
  args: {
    input: {
      type: 'positional',
      required: false,
      description: 'Path to the OpenAPI specification, overriding the config',
    },
    config: {
      type: 'string',
      description: 'Path to the Kubb config',
      short: 'c',
    },
    logLevel: {
      type: 'enum',
      choices: ['silent', 'info', 'verbose'] as const,
      description: 'Info, silent or verbose',
      short: 'l',
      default: 'info',
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
      default: false,
    },
    silent: {
      type: 'boolean',
      description: 'Override logLevel to silent',
      short: 's',
      default: false,
    },
    reporter: {
      type: 'custom',
      description: 'Reporters that render the run, comma-separated. Overrides config.reporters',
      metavar: 'cli|json|file',
      parse: parseReporters,
    },
  },
  async run({ values }) {
    const logLevel = values.verbose ? 'verbose' : values.silent ? 'silent' : values.logLevel
    const { run } = await import('../runners/generate/run.ts')

    await run({
      input: values.input,
      configPath: values.config,
      logLevel,
      watch: values.watch,
      reporters: values.reporter,
    })
  },
})
