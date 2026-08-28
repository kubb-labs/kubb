import { define } from 'gunshi'

/**
 * Declaration only, so listing `kubb --help` never loads `@kubb/studio`. `index.ts` pairs this
 * with the runner through gunshi's `lazy`.
 */
export const definition = define({
  name: 'studio',
  description:
    'Connect this project to Kubb Studio and generate from the browser. The first run pairs the machine: the CLI shows a code, you approve it in Studio, and the token is stored in ~/.kubb. The connection is read-only unless you grant more with the --allow flags.',
  examples: [
    'kubb studio',
    'kubb studio --allow-write',
    'kubb studio login',
    'kubb studio status',
    'kubb studio logout',
    'kubb studio --url http://localhost:3000',
  ].join('\n'),
  args: {
    action: {
      type: 'positional',
      required: false,
      description: 'connect (default), login, logout or status',
    },
    config: {
      type: 'string',
      description: 'Path to the Kubb config',
      short: 'c',
    },
    url: {
      type: 'string',
      description: 'Base URL of the Kubb Studio instance',
    },
    allowWrite: {
      type: 'boolean',
      description: 'Write generated files to disk. Asked for once per project when omitted',
      default: false,
    },
    allowInput: {
      type: 'boolean',
      description: 'Generate from an OpenAPI spec sent by Studio instead of the one on disk',
      default: false,
    },
    allowExec: {
      type: 'boolean',
      description: 'Run the formatter, the linter, and output.postGenerate after a generation',
      default: false,
    },
    open: {
      type: 'boolean',
      description: 'Open the approval page in a browser while pairing',
      default: true,
      negatable: true,
    },
    logLevel: {
      type: 'enum',
      choices: ['silent', 'info', 'verbose'] as const,
      description: 'Info, silent or verbose',
      short: 'l',
      default: 'info',
    },
  },
})
