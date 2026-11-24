import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { getErrorMessage } from '@internals/utils'
import { readInstalledPackages } from '@kubb/core'
import { x } from 'tinyexec'
import { BUNDLED_PACKAGES, readImports } from '@internals/shared'
import {
  AgentPermission,
  type AgentPermissions,
  type InstallExtensionInput,
  type InstallExtensionResult,
  type InstalledExtensions,
  type RemoveExtensionInput,
  type RemoveExtensionResult,
  type UpdateExtensionsInput,
  type UpdateExtensionsResult,
} from './protocol.ts'

const INSTALL_TIMEOUT_MS = 5 * 60_000
/** How many trailing lines of a failed `kubb add` the reason keeps. */
const INSTALL_OUTPUT_LINES = 20
/** `owner/slug` or `slug`, as `kubb add` takes it. Checked before it becomes an argument. */
const REGISTRY_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?$/

/** What the extension commands read from the agent. */
export type ExtensionCommandContext = {
  root: string
  configFile: string
  kubbBin?: string
  permissions: AgentPermissions
  busy: () => string | undefined
  warn: (warning: { message: string; permission?: AgentPermission }) => Promise<void>
  logCommand: (command: 'installExtension' | 'updateExtensions' | 'removeExtension', info: string, requestedBy?: string, failed?: boolean) => Promise<void>
  runKubb: (input: { bin: string; args: Array<string> }) => Promise<{ failed: boolean; output: string }>
}

/** The CLI the project depends on, so `kubb add` installs next to what the config imports. */
function findKubbBin(root: string): string | undefined {
  const requireModule = createRequire(path.resolve(root, 'package.json'))
  const names = ['kubb', '@kubb/cli']
  // Nearest directory first, so a nested project does not pick up an ancestor's CLI.
  return (requireModule.resolve.paths('kubb') ?? [])
    .flatMap((dir) => names.map((name) => path.join(dir, name, 'bin', 'kubb.js')))
    .find((bin) => existsSync(bin))
}

/** Runs a `kubb` command without a shell, and keeps the end of its output for the failure reason. */
export async function runKubb({ bin, args, cwd, signal }: { bin: string; args: Array<string>; cwd: string; signal: AbortSignal }) {
  try {
    const { stdout, stderr, exitCode } = await x(process.execPath, [bin, ...args], {
      signal,
      timeout: INSTALL_TIMEOUT_MS,
      throwOnError: false,
      nodeOptions: { cwd, env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' } },
    })
    const output = `${stdout}\n${stderr}`.trim().split('\n').slice(-INSTALL_OUTPUT_LINES).join('\n')
    return { failed: exitCode !== 0, output: output || `kubb ${args[0]} exited with ${exitCode ?? 'a signal'}` }
  } catch (error) {
    // tinyexec still throws when the timeout hits or the process cannot start.
    return { failed: true, output: `kubb ${args[0]} did not run: ${getErrorMessage(error)}` }
  }
}

// Not cached: the user can install a plugin while the agent runs. Keeps each project
// dependency, config import and built-in that resolves and ships a valid `kubb-extension.json`.
export async function readInstalledExtensions({ root, source }: { root: string; source: Promise<string> }): Promise<InstalledExtensions> {
  const imports = await source.then(readImports, () => [])
  const installed = await readInstalledPackages({ root, packages: [...imports, ...BUNDLED_PACKAGES], resolveFrom: ['kubb'] })

  return new Map(
    installed.flatMap(({ package: name, version, manifest }) =>
      version !== undefined && manifest
        ? [[name, { package: name, version, manifest, ...(BUNDLED_PACKAGES.includes(name) ? { bundled: true as const } : {}) }] as const]
        : [],
    ),
  )
}

/**
 * Installs a registry extension into the project with `kubb add <id> --yes`, which also adds a
 * plugin to `kubb.config.ts`. Studio calls `connect()` again afterwards to see the result.
 */
export async function installExtension(input: InstallExtensionInput, context: ExtensionCommandContext): Promise<InstallExtensionResult> {
  const { root, configFile, kubbBin = findKubbBin(root), permissions } = context
  const refuse = async (reason: string, permission?: AgentPermission): Promise<InstallExtensionResult> => {
    await context.warn({ message: `Ignored install: ${reason}`, permission })
    return { installed: false, reason }
  }

  if (typeof input?.id !== 'string' || !REGISTRY_ID.test(input.id)) return refuse('the message carried no registry id')
  if (!permissions.allowInstall) return refuse('installing extensions was not granted', AgentPermission.INSTALL)
  if (!permissions.allowConfigEdit) return refuse('editing kubb.config.ts was not granted', AgentPermission.CONFIG_EDIT)
  const busy = context.busy()
  if (busy) return refuse(busy)
  if (!kubbBin) return refuse('kubb is not installed in the project')

  const { failed, output } = await context.runKubb({ bin: kubbBin, args: ['add', input.id, '--yes', '--config', configFile] })
  await context.logCommand('installExtension', `${failed ? 'failed to install' : 'installed'} ${input.id}`, input.requestedBy, failed)
  return failed ? { installed: false, reason: output } : { installed: true }
}

/**
 * Moves installed extensions to the registry's version with `kubb update [ids] --yes`, which
 * installs packages and leaves `kubb.config.ts` alone. Studio calls `connect()` again afterwards.
 */
export async function updateExtensions(input: UpdateExtensionsInput, context: ExtensionCommandContext): Promise<UpdateExtensionsResult> {
  const { root, kubbBin = findKubbBin(root), permissions } = context
  const refuse = async (reason: string, permission?: AgentPermission): Promise<UpdateExtensionsResult> => {
    await context.warn({ message: `Ignored update: ${reason}`, permission })
    return { updated: false, reason }
  }

  const ids = input?.ids ?? []
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string' && REGISTRY_ID.test(id))) return refuse('the message carried an invalid registry id')
  if (!permissions.allowUpdate) return refuse('updating extensions was not granted', AgentPermission.UPDATE)
  const busy = context.busy()
  if (busy) return refuse(busy)
  if (!kubbBin) return refuse('kubb is not installed in the project')

  const { failed, output } = await context.runKubb({ bin: kubbBin, args: ['update', ...ids, '--yes'] })
  await context.logCommand('updateExtensions', `${failed ? 'failed to update' : 'updated'} ${ids.join(', ') || 'all extensions'}`, input?.requestedBy, failed)
  return failed ? { updated: false, reason: output } : { updated: true }
}

/**
 * Removes an extension with `kubb remove <id> --yes`, which deletes it from `kubb.config.ts` and
 * uninstalls its package. Studio calls `connect()` again afterwards.
 */
export async function removeExtension(input: RemoveExtensionInput, context: ExtensionCommandContext): Promise<RemoveExtensionResult> {
  const { root, configFile, kubbBin = findKubbBin(root), permissions } = context
  const refuse = async (reason: string, permission?: AgentPermission): Promise<RemoveExtensionResult> => {
    await context.warn({ message: `Ignored remove: ${reason}`, permission })
    return { removed: false, reason }
  }

  if (typeof input?.id !== 'string' || !REGISTRY_ID.test(input.id)) return refuse('the message carried no registry id')
  if (!permissions.allowRemove) return refuse('removing extensions was not granted', AgentPermission.REMOVE)
  if (!permissions.allowConfigEdit) return refuse('editing kubb.config.ts was not granted', AgentPermission.CONFIG_EDIT)
  const busy = context.busy()
  if (busy) return refuse(busy)
  if (!kubbBin) return refuse('kubb is not installed in the project')

  const { failed, output } = await context.runKubb({ bin: kubbBin, args: ['remove', input.id, '--yes', '--config', configFile] })
  await context.logCommand('removeExtension', `${failed ? 'failed to remove' : 'removed'} ${input.id}`, input.requestedBy, failed)
  return failed ? { removed: false, reason: output } : { removed: true }
}
