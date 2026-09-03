import { define } from 'gunshi'

/**
 * Declaration only, so listing `kubb --help` never loads `@kubb/studio`. `index.ts` pairs this
 * with the runner through gunshi's `lazy`.
 */
export const definition = define({
  name: 'studio',
  description:
    'Connect this project to Kubb Studio and generate from the browser. The first run pairs the machine: the CLI shows a code, you approve it in Studio, and the token is stored in ~/.kubb. The connection is read-only unless you grant more with --allowWrite, --allowConfigEdit, --allowInput or --allowExec.',
  examples: [
    'kubb studio                              # connect this project, asking what Studio may do',
    'kubb studio --allowWrite                 # grant writing generated files, no question asked',
    'kubb studio --allowWrite --allowExec     # also run the formatter, the linter, and postGenerate',
    'kubb studio --allowConfigEdit            # let Studio change plugin options in kubb.config.ts',
    'kubb studio login                        # pair this machine without connecting',
    'kubb studio status                       # show what this machine is paired as',
    'kubb studio logout                       # forget the stored token',
    'kubb studio --url http://localhost:3000  # use a self-hosted Studio',
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
    allowConfigEdit: {
      type: 'boolean',
      description: 'Let Studio change plugin options in kubb.config.ts. Asked for once per project when omitted',
      default: false,
    },
    allowInput: {
      type: 'boolean',
      description: 'Generate from an OpenAPI spec sent by Studio instead of the one on disk. Asked for once per project when omitted',
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
