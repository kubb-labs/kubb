import { define } from 'gunshi'

/**
 * Declaration only, so listing `kubb --help` never loads `@kubb/studio`. `index.ts` pairs this
 * with the runner through gunshi's `lazy`.
 */
export const definition = define({
  name: 'studio',
  description:
    'Connect this project to Kubb Studio and generate from the browser, or run `snapshot` from CI to publish one from a script. The first run pairs the machine: the CLI shows a code, you approve it in Studio, and the token is stored in ~/.kubb. The connection is read-only unless you grant more with --allow-write, --allow-config-edit, --allow-input or --allow-exec.',
  examples: [
    'kubb studio                              # connect this project, asking what Studio may do',
    'kubb studio --allow-write                # grant writing generated files, no question asked',
    'kubb studio --allow-write --allow-exec   # also run the formatter, the linter, and postGenerate',
    'kubb studio --allow-config-edit          # let Studio change plugin options in kubb.config.ts',
    'kubb studio login                        # pair this machine without connecting',
    'kubb studio status                       # show what this machine is paired as',
    'kubb studio logout                       # forget the stored token',
    'kubb studio --url http://localhost:3000  # use a self-hosted Studio',
    'kubb studio snapshot                     # generate and publish a snapshot from CI',
    'kubb studio snapshot --json              # print the snapshot as one JSON object',
  ].join('\n'),
  toKebab: true,
  args: {
    action: {
      type: 'positional',
      required: false,
      description: 'connect (default), login, logout, status or snapshot',
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
    token: {
      type: 'string',
      description: 'Organization CI API key for `snapshot`. Defaults to KUBB_TOKEN',
    },
    id: {
      type: 'string',
      description:
        '`snapshot` only: stable identity for the CI agent, such as a pull request. Auto-detected on GitHub Actions, GitLab CI, Bitbucket Pipelines and CircleCI',
    },
    name: {
      type: 'string',
      description: '`snapshot` only: package name for the generated tarball. Defaults to the name in package.json',
    },
    packageVersion: {
      type: 'string',
      description: '`snapshot` only: package version for the generated tarball. Defaults to the version in package.json',
    },
    timeout: {
      type: 'number',
      description: '`snapshot` only: seconds to wait for the job to finish',
      default: 600,
    },
    json: {
      type: 'boolean',
      description: '`snapshot` only: print the result as one JSON object instead of a summary',
      default: false,
    },
  },
})
