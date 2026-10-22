import { pluginId as dryRunId } from '@gunshi/plugin-dryrun'
import type { DryRunExtension } from '@gunshi/plugin-dryrun'

export { dryRunId }

/** Extension shape gunshi's command context carries with `@gunshi/plugin-dryrun`; the `extensions` type parameter of `defineWithTypes`. */
export type DryRunExtensions = {
  [dryRunId]: DryRunExtension
}

export const configArg = {
  config: {
    type: 'string',
    description: 'Path to the Kubb config',
    short: 'c',
  },
} as const

export const yesArg = {
  yes: {
    type: 'boolean',
    description: 'Skip the confirmation',
    short: 'y',
    default: false,
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
  allowReadAst: {
    type: 'boolean',
    description: 'Read the parsed spec (the Kubb AST). Asked for once per project when omitted',
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
  allowInstall: {
    type: 'boolean',
    description: 'Let Studio install extensions from the registry with kubb add; needs --allow-config-edit too. Asked for once per project when omitted',
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
