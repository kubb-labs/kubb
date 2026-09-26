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
    toKebab: true,
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
    toKebab: true,
  },
  allowWrite: {
    type: 'boolean',
    description: 'Write generated files to disk. Asked for once per project when omitted',
    default: false,
    toKebab: true,
  },
  allowConfigEdit: {
    type: 'boolean',
    description: 'Let Studio change plugin options in kubb.config.ts. Asked for once per project when omitted',
    default: false,
    toKebab: true,
  },
  allowExec: {
    type: 'boolean',
    description: 'Run the formatter, the linter, and output.postGenerate after a generation',
    default: false,
    toKebab: true,
  },
} as const
