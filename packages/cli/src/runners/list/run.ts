import process from 'node:process'
import { styleText } from 'node:util'
import { getErrorMessage } from '@internals/utils'
import { define } from 'gunshi'
import { readInstalledPackages, type RegistryEntry } from '@kubb/core'
import { logOutro } from '../../ui/intro.ts'
import { logBlock, logError, logWarn } from '../../ui/log.ts'
import { formatTable } from '../../ui/table.ts'
import { fetchRegistryIndex, isOutdated, registryUrl } from '../../utils/registry.ts'

export type ListRow = {
  id?: string
  package: string
  installed?: string
  registry?: string
  update: boolean
}

/**
 * The installed packages that ship a `kubb-extension.json` or have a registry entry, with the
 * version the registry pins.
 */
export async function listExtensions({ cwd, registry }: { cwd: string; registry: string }): Promise<Array<ListRow>> {
  const [installed, entries] = await Promise.all([
    readInstalledPackages({ root: cwd }),
    fetchRegistryIndex({ registry }).catch((error: unknown): Array<RegistryEntry> => {
      logWarn(`Showing installed extensions only: ${getErrorMessage(error)}`)
      return []
    }),
  ])
  const byPackage = new Map(entries.map((entry) => [entry.artifact.package, entry]))

  return installed.flatMap(({ package: name, version, manifest }): Array<ListRow> => {
    const entry = byPackage.get(name)
    if (!entry && !manifest) return []
    const latest = entry?.artifact.version
    return [{ id: entry?.id, package: name, installed: version, registry: latest, update: !!latest && isOutdated({ installed: version, latest }) }]
  })
}

/** Prints the installed extensions as a table. */
export async function run(): Promise<void> {
  try {
    const rows = await listExtensions({ cwd: process.cwd(), registry: registryUrl() })
    if (!rows.length) {
      logOutro('No installed extensions found.')
      return
    }

    const header = ['ID', 'PACKAGE', 'INSTALLED', 'REGISTRY', 'UPDATE']
    const cells = rows.map((row) => [row.id ?? '-', row.package, row.installed ?? '-', row.registry ?? '-', row.update ? 'yes' : 'no'])
    const [head, ...body] = formatTable([header, ...cells])
    logBlock([styleText('dim', head!), ...body])
  } catch (error) {
    logError(getErrorMessage(error))
    process.exitCode = 1
  }
}

export const command = define({
  name: 'list',
  description: 'List installed extensions, their versions, and available updates.',
  examples: 'kubb list',
  run: () => run(),
})
