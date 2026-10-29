import { pluginId as dryRunId } from '@gunshi/plugin-dryrun'
import type { DryRunExtension } from '@gunshi/plugin-dryrun'
import type { AgentPermission } from '@kubb/studio/protocol'

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

const studioPermissionDescriptions: Record<AgentPermission, string> = {
  allowRead: 'Read the source of files a generation produced. Asked for once per project when omitted',
  allowReadAst: 'Read the parsed spec (the Kubb AST). Asked for once per project when omitted',
  allowWrite: 'Write generated files to disk. Asked for once per project when omitted',
  allowConfigEdit: 'Let Studio change plugin options in kubb.config.ts. Asked for once per project when omitted',
  allowInstall: 'Let Studio install extensions from the registry with kubb add; needs --allow-config-edit too. Asked for once per project when omitted',
  allowUpdate: 'Let Studio update installed extensions with kubb update. Asked for once per project when omitted',
  allowRemove:
    'Let Studio remove extensions with kubb remove, which edits kubb.config.ts and uninstalls packages; needs --allow-config-edit too. Asked for once per project when omitted',
  allowSaveInput: 'Let Studio save the spec it sends as the input in kubb.config.ts; needs --allow-config-edit too. Asked for once per project when omitted',
  allowExec: 'Run the formatter, the linter, and output.postGenerate after a generation',
}

/** One `--allow-*` boolean flag per {@link AgentPermission}, off by default. */
export const studioPermissionArgs = Object.fromEntries(
  Object.entries(studioPermissionDescriptions).map(([key, description]) => [key, { type: 'boolean', description, default: false, toKebab: true }]),
) as Record<AgentPermission, { type: 'boolean'; description: string; default: false; toKebab: true }>
