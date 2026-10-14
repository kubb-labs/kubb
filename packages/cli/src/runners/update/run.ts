import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { define } from 'gunshi'
import { getErrorMessage } from '@internals/utils'
import { readInstalledPackages, type RegistryEntry } from '@kubb/core'
import { yesArg } from '../../commands/shared.ts'
import { logBlock, logError, logInfo, logIntro, logOutro, logStep, logWarn } from '../../loggers/output.ts'
import { fetchRegistryIndex, incompatibility, installSpec, isOutdated, registryUrl, toRegistryId } from '../../utils/registry.ts'
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

    const change = ({ kind, artifact }: RegistryEntry) =>
      `${kind}  ${versions.get(artifact.package) ?? 'not installed'} -> ${styleText('green', artifact.version)}`
    logBlock(proposals.map((entry) => `${entry.artifact.package}  ${change(entry)}`))

    if (check) {
      const plural = proposals.length === 1 ? '' : 's'
      logOutro(`${proposals.length} update${plural} available. Run \`kubb update\` to install.`)
      return
    }

    let selected = proposals
    if (!yes) {
      const chosen = await clack.multiselect({
        message: 'Select the updates to install:',
        options: proposals.map((entry) => ({ value: entry.id, label: entry.artifact.package, hint: change(entry) })),
        initialValues: proposals.map((entry) => entry.id),
        required: true,
      })
      if (clack.isCancel(chosen)) {
        clack.cancel('Operation canceled.')
        return
      }
      selected = proposals.filter((entry) => chosen.includes(entry.id))
    }

    const plural = selected.length === 1 ? '' : 's'
    const packageManager = detectPackageManager(cwd)
    const specs = selected.map(({ artifact }) => installSpec(artifact))
    logStep(`Installing ${specs.join(', ')} with ${packageManager.name}`)
    await installPackages(specs, packageManager, cwd)

    logInfo(`Updated ${specs.length} extension${plural}`)
    logOutro(styleText('green', 'Done'))
  } catch (error) {
    logError(getErrorMessage(error))
    process.exitCode = 1
  }
}

export const command = define({
  name: 'update',
  description:
    'Update installed extensions to the version the Kubb registry pins. Pass ids to update only those, or --check to list the updates without installing.',
  examples: ['kubb update', 'kubb update --check', 'kubb update plugin-zod plugin-ts --yes'].join('\n'),
  args: {
    ids: {
      type: 'positional',
      description: 'Registry ids to update, all installed extensions when omitted',
      multiple: true,
    },
    check: {
      type: 'boolean',
      description: 'List the available updates without installing them',
      default: false,
    },
    ...yesArg,
  },
  run: ({ values }) => run({ ids: values.ids ?? [], check: values.check, yes: values.yes }),
})
