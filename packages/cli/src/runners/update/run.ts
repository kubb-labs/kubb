import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import type { RegistryEntry } from '@kubb/core'
import { logBlock, logError, logInfo, logIntro, logOutro, logStep, logWarn } from '../../loggers/output.ts'
import { fetchRegistryIndex, incompatibility, isOutdated, readInstalledPackages, registryUrl, toRegistryId } from '../../utils/registry.ts'
import { detectPackageManager, installPackages } from '../init/utils.ts'

export type UpdateOptions = {
  /**
   * Registry ids to update. Empty updates every installed extension the registry lists.
   */
  ids: Array<string>
  check: boolean
  yes: boolean
}

type Proposal = { entry: RegistryEntry; installed?: string }

/**
 * Moves installed extensions to the version the registry pins. Lists the proposals, asks, then
 * installs them. With `check`, only lists them.
 */
export async function run({ ids, check, yes }: UpdateOptions): Promise<void> {
  const cwd = process.cwd()
  logIntro({ title: styleText('bgCyan', styleText('black', ' Kubb Update ')) })

  try {
    const wanted = new Set(ids.map(toRegistryId))
    const [entries, installed] = await Promise.all([fetchRegistryIndex({ registry: registryUrl() }), readInstalledPackages(cwd)])
    const versions = new Map(installed.map((item) => [item.package, item.version]))

    const tracked = entries.filter((entry) => versions.has(entry.artifact.package) && (!wanted.size || wanted.has(entry.id)))
    for (const id of wanted) {
      if (!tracked.some((entry) => entry.id === id)) logWarn(`${id} is not installed, or not in the registry.`)
    }

    const proposals: Array<Proposal> = []
    for (const entry of tracked) {
      const current = versions.get(entry.artifact.package)
      if (!isOutdated({ installed: current, latest: entry.artifact.version })) continue

      const problem = incompatibility(entry.manifest)
      if (problem) {
        logWarn(`Skipped ${entry.id}: ${problem}`)
        continue
      }
      proposals.push({ entry, installed: current })
    }

    if (!proposals.length) {
      logOutro('Every installed extension is up to date.')
      return
    }

    logBlock(
      proposals.map(({ entry, installed }) => `${entry.artifact.package}  ${installed ?? 'not installed'} -> ${styleText('green', entry.artifact.version)}`),
    )

    if (check) {
      logOutro(`${proposals.length} update${proposals.length === 1 ? '' : 's'} available. Run \`kubb update\` to install.`)
      return
    }

    if (!yes) {
      const confirmed = await clack.confirm({ message: `Install ${proposals.length} update${proposals.length === 1 ? '' : 's'}?`, initialValue: true })
      if (clack.isCancel(confirmed) || !confirmed) {
        clack.cancel('Operation canceled.')
        return
      }
    }

    const packageManager = detectPackageManager(cwd)
    const specs = proposals.map(({ entry }) => `${entry.artifact.package}@${entry.artifact.version}`)
    logStep(`Installing ${specs.join(', ')} with ${packageManager.name}`)
    await installPackages(specs, packageManager, cwd)

    logInfo(`Updated ${specs.length} extension${specs.length === 1 ? '' : 's'}`)
    logOutro(styleText('green', 'Done'))
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
