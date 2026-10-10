export const configArg = {
  config: {
    type: 'string',
    description: 'Path to the Kubb config',
    short: 'c',
  },
} as const

export const logLevelArg = {
  logLevel: {
    type: 'enum',
    choices: ['silent', 'info', 'verbose'] as const,
    description: 'Info, silent or verbose',
    short: 'l',
    default: 'info',
  },
} as const

export const studioConnectionArgs = {
  url: {
    type: 'string',
    description: 'Base URL of the Kubb Studio instance',
  },
  token: {
    type: 'string',
    description: 'Organization CI API key for `snapshot`. Defaults to KUBB_TOKEN',
  },
} as const

export const studioPermissionArgs = {
  allowRead: {
    type: 'boolean',
    description: 'Read the source of files a generation produced. Asked for once per project when omitted',
    default: false,
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
  allowExec: {
    type: 'boolean',
    description: 'Run the formatter, the linter, and output.postGenerate after a generation',
    default: false,
  },
} as const

export const openArg = {
  open: {
    type: 'boolean',
    description: 'Open the approval page in a browser while pairing',
    default: true,
    negatable: true,
  },
} as const
