import process from 'node:process'
import { styleText } from 'node:util'
import * as prompts from '@clack/prompts'
import { KUBB_CONFIG_FILENAME } from '@internals/shared'
import { isCIEnvironment } from '@internals/utils'
import type { AgentPermission } from '@kubb/studio/protocol'
import { toPermissionFlag } from '../../ui/text.ts'
import { canUseTTY } from '../../utils/env.ts'
import { type Credentials, updateCredentials } from './credentials.ts'
import type { StudioOptions } from './run.ts'

/**
 * What each permission is asked as, in the order the list shows them.
 */
const PERMISSION_PROMPTS: Record<
  AgentPermission,
  {
    /**
     * Short label for status output and the connect summary.
     */
    label: string
    title: (configPath: string) => string
    hint: string
  }
> = {
  allowRead: { label: 'read source', title: () => 'Read generated files', hint: 'show code in the browser' },
  allowReadAst: { label: 'read spec', title: () => 'Read the parsed spec', hint: 'browse schemas and operations' },
  allowWrite: { label: 'write files', title: () => 'Write files to disk', hint: 'generate from the browser' },
  allowConfigEdit: { label: 'edit config', title: (configPath) => `Change ${configPath}`, hint: 'edit plugin options' },
  allowInstall: { label: 'add plugins', title: () => 'Install extensions from the registry', hint: 'kubb add from the browser' },
  allowUpdate: { label: 'update plugins', title: () => 'Update installed extensions', hint: 'kubb update from the browser' },
  allowRemove: { label: 'remove plugins', title: () => 'Remove extensions', hint: 'kubb remove from the browser' },
  allowSaveInput: {
    label: 'save input',
    title: (configPath) => `Save the spec from Studio as the input in ${configPath}`,
    hint: 'keep a pasted spec, URL, or git file',
  },
  allowFileRefs: { label: 'outside refs', title: () => 'Let a $ref read files outside the project', hint: 'specs that share schemas' },
  allowExec: { label: 'run tools', title: () => 'Run the formatter, linter, and postGenerate', hint: 'after each generation' },
}

const PERMISSIONS = Object.entries(PERMISSION_PROMPTS).map(([key, prompt]) => ({ key: key as AgentPermission, ...prompt }))

/** The labels of the granted permissions, for the connect summary. */
export function formatPermissionSummary(granted: Record<AgentPermission, boolean>): string {
  return (
    PERMISSIONS.filter(({ key }) => granted[key])
      .map(({ label }) => label)
      .join(' · ') || 'no permissions'
  )
}

/**
 * Two permissions per row, each marked granted or not, with the flags that grant the missing ones
 * after the last row. For `kubb studio status`.
 */
export function formatPermissionRows(granted: Partial<Record<AgentPermission, boolean>>): Array<string> {
  const width = Math.max(...PERMISSIONS.map(({ label }) => label.length))
  const cells = PERMISSIONS.map(({ key, label }) => `${granted[key] ? styleText('green', '✓') : styleText('red', '✖')} ${label.padEnd(width)}`)
  const rows = Array.from({ length: Math.ceil(cells.length / 2) }, (_, index) => cells.slice(index * 2, index * 2 + 2).join('  '))
  const flags = PERMISSIONS.filter(({ key }) => !granted[key])
    .map(({ key }) => toPermissionFlag(key))
    .join(' ')

  return flags ? [...rows.slice(0, -1), `${rows.at(-1)}   ${styleText('dim', flags)}`] : rows
}

/**
 * Resolves Studio permissions for the current project.
 * Flags win, saved answers are reused, and the rest are asked in one list whose answers are stored
 * in `~/.kubb/credentials.json`.
 */
export async function resolvePermissions(
  options: StudioOptions,
  credentials: Credentials,
  configPath: string = KUBB_CONFIG_FILENAME,
  { edit = false }: { edit?: boolean } = {},
): Promise<Record<AgentPermission, boolean>> {
  const project = process.cwd()
  const remembered = credentials.projects?.[project]
  const granted = Object.fromEntries(PERMISSIONS.map(({ key }) => [key, options.permission[key] || remembered?.[key] === true])) as Record<
    AgentPermission,
    boolean
  >
  // `edit` asks again for every permission no flag grants, with the saved ones checked.
  const pending = PERMISSIONS.filter(({ key }) => !options.permission[key] && (edit || typeof remembered?.[key] !== 'boolean'))

  if (!pending.length || isCIEnvironment() || !canUseTTY()) return granted

  prompts.updateSettings({ withGuide: true })
  const selected = await prompts.multiselect({
    message: 'What may Kubb Studio do in this project?',
    options: pending.map(({ key, title, hint }) => ({ value: key, label: title(configPath), hint })),
    ...(edit ? { initialValues: pending.filter(({ key }) => remembered?.[key] === true).map(({ key }) => key) } : {}),
    required: false,
  })
  // A canceled list grants nothing and saves nothing, so the next run asks again.
  if (prompts.isCancel(selected)) {
    if (edit) throw new Error('Canceled. Permissions are unchanged.')
    return granted
  }

  const answers = Object.fromEntries(pending.map(({ key }) => [key, selected.includes(key)]))
  // Merged into the stored record, so a token refreshed by a running connection is kept.
  await updateCredentials((stored) => {
    const current = stored ?? credentials
    return { ...current, projects: { ...current.projects, [project]: { ...current.projects?.[project], ...answers } } }
  })

  return { ...granted, ...answers }
}
