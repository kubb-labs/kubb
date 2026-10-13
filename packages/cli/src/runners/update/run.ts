import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { getErrorMessage } from '@internals/utils'
import { readInstalledPackages } from '@kubb/core'
import { logBlock, logError, logInfo, logIntro, logOutro, logStep, logWarn } from '../../loggers/output.ts'
import { fetchRegistryIndex, incompatibility, isOutdated, registryUrl, toRegistryId } from '../../utils/registry.ts'
import { detectPackageManager, installPackages } from '../init/utils.ts'

export type UpdateOptions = {
  /**
   * Registry ids to update. Empty updates every installed extension the registry lists.
   */
  ids: Array<string>
  check: boolean
  yes: boolean
}

/**
 * Moves installed extensions to the version the registry pins. Lists the proposals, asks, then
 * installs them. With `check`, only lists them.
 */
export async function run({ ids, check, yes }: UpdateOptions): Promise<void> {
  const cwd = process.cwd()
  logIntro({ title: styleText('bgCyan', styleText('black', ' Kubb Update ')) })

  try {
    const wanted = new Set(ids.map(toRegistryId))
    const [entries, installed] = await Promise.all([fetchRegistryIndex({ registry: registryUrl() }), readInstalledPackages({ root: cwd })])
    const versions = new Map(installed.map((item) => [item.package, item.version]))

    const tracked = entries.filter((entry) => versions.has(entry.artifact.package) && (!wanted.size || wanted.has(entry.id)))
    for (const id of wanted) {
      if (!tracked.some((entry) => entry.id === id)) logWarn(`${id} is not installed, or not in the registry.`)
    }

    const proposals = tracked.filter((entry) => {
      if (!isOutdated({ installed: versions.get(entry.artifact.package), latest: entry.artifact.version })) return false
      const problem = incompatibility(entry.manifest)
      if (problem) logWarn(`Skipped ${entry.id}: ${problem}`)
      return !problem
    })

    if (!proposals.length) {
      logOutro(ids.length ? `No updates for ${ids.join(', ')}.` : 'Every installed extension is up to date.')
      return
    }

    const plural = proposals.length === 1 ? '' : 's'
    logBlock(
      proposals.map(({ artifact }) => `${artifact.package}  ${versions.get(artifact.package) ?? 'not installed'} -> ${styleText('green', artifact.version)}`),
    )

    if (check) {
      logOutro(`${proposals.length} update${plural} available. Run \`kubb update\` to install.`)
      return
    }

    const confirmed = yes || (await clack.confirm({ message: `Install ${proposals.length} update${plural}?`, initialValue: true }))
    if (clack.isCancel(confirmed) || !confirmed) {
      clack.cancel('Operation canceled.')
      return
    }

    const packageManager = detectPackageManager(cwd)
    const specs = proposals.map(({ artifact }) => `${artifact.package}@${artifact.version}`)
    logStep(`Installing ${specs.join(', ')} with ${packageManager.name}`)
    await installPackages(specs, packageManager, cwd)

    logInfo(`Updated ${specs.length} extension${plural}`)
    logOutro(styleText('green', 'Done'))
  } catch (error) {
    logError(getErrorMessage(error))
    process.exitCode = 1
  }
}
