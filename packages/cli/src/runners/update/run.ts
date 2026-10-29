import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { defineWithTypes } from 'gunshi'
import { findConfigFile } from '@internals/shared'
import { getErrorMessage, pascalCase } from '@internals/utils'
import { type GenerationResult, Hookable, type KubbHooks, logLevel as logLevelMap, readInstalledPackages, type RegistryEntry, type Reporter } from '@kubb/core'
import { pluralize } from '../../ui/text.ts'
import { dryRunId, type DryRunExtensions, yesArg } from '../../commands/shared.ts'
import { isInteractiveRun, logIntro } from '../../ui/intro.ts'
import { logBlock, logError, logStep, logWarn } from '../../ui/log.ts'
import { createSpinner, withSpinner } from '../../ui/spinner.ts'
import { createSummary } from '../../ui/summary.ts'
import { formatTable } from '../../ui/table.ts'
import { bumpOf, fetchRegistryIndex, incompatibility, installSpec, isOutdated, registryUrl, toRegistryId, toShortId } from '../../utils/registry.ts'
import { detectPackageManager } from '../init/utils.ts'
import { installWithSpinner } from '../installWithSpinner.ts'

export type UpdateOptions = {
  /**
   * Registry ids to update. Empty updates every installed extension the registry lists.
   */
  ids: Array<string>
  /**
   * List the updates without installing anything.
   */
  dryRun: boolean
  yes: boolean
}

type FileChanges = NonNullable<GenerationResult['fileChanges']>

/**
 * Generates every config in this process, the way `kubb generate` does, and returns the counts of
 * output files it changed. Runs after the install, so the config loads the new versions.
 * `undefined` when the config fails to load or a build fails.
 */
async function regenerate({ cwd, configPath }: { cwd: string; configPath: string }): Promise<{ changes: FileChanges; output: string } | undefined> {
  const spinner = createSpinner()
  spinner.start('Generating with the new versions')
  try {
    // Imported here, so the config loader and the generate path never slow down `kubb --help`.
    const [{ getConfigs }, { generate }, { default: setupReporters }] = await Promise.all([
      import('../../config.ts'),
      import('../generate/run.ts'),
      import('../../loggers/reporters.ts'),
    ])
    const { configs } = await getConfigs({ configPath })
    const hooks = new Hookable<KubbHooks>()
    const changes: FileChanges = { added: 0, modified: 0, deleted: 0, linesAdded: 0, linesRemoved: 0 }
    const collect: Reporter = {
      name: 'update',
      report: ({ fileChanges }) => {
        for (const key of Object.keys(changes) as Array<keyof FileChanges>) changes[key] += fileChanges?.[key] ?? 0
      },
    }
    setupReporters(hooks, { logLevel: logLevelMap.info, reporters: [collect], fileChanges: true })
    for (const config of configs) {
      if (!(await generate({ config, hooks }))) throw new Error('Generation failed')
    }
    const changed = changes.added + changes.modified + changes.deleted
    spinner.stop(changed ? `Generated: ${pluralize(changed, 'file')} changed` : 'Generated: no files changed')
    return { changes, output: configs.map((config) => path.relative(cwd, path.resolve(config.root ?? cwd, config.output.path)) || '.').join(', ') }
  } catch (error) {
    spinner.error(`Generation failed: ${getErrorMessage(error)}`)
    return undefined
  }
}

/**
 * Moves installed extensions to the version the registry pins. Shows each version change with its
 * bump, asks which to install with majors left out, installs them, and regenerates to show which
 * files changed. With `dryRun`, only lists the updates and installs nothing.
 */
export async function run({ ids, dryRun, yes }: UpdateOptions): Promise<void> {
  const cwd = process.cwd()
  const hrStart = process.hrtime()
  const installedPackages: Array<string> = []
  const summary = createSummary(hrStart)
  logIntro({ title: isInteractiveRun({ yes, dryRun }) ? undefined : styleText('bgCyan', styleText('black', ' Kubb Update ')) })

  try {
    const wanted = new Set(ids.map(toRegistryId))
    const [entries, installed] = await withSpinner({
      message: 'Checking the registry',
      promise: Promise.all([fetchRegistryIndex({ registry: registryUrl() }), readInstalledPackages({ root: cwd })]),
    })
    const versions = new Map(installed.map((item) => [item.package, item.version]))

    const tracked = entries.filter((entry) => versions.has(entry.artifact.package) && (!wanted.size || wanted.has(entry.id)))
    for (const id of wanted) {
      if (tracked.some((entry) => entry.id === id)) continue
      logWarn(`${id} is not installed, or not in the registry.`)
      // A caller that named it, such as Studio, must not read the run as a successful update.
      process.exitCode = 1
    }

    const current = ({ artifact }: RegistryEntry) => versions.get(artifact.package)
    const isMajor = (entry: RegistryEntry) => bumpOf({ installed: current(entry), latest: entry.artifact.version }) === 'major'
    const outdated = tracked.filter((entry) => isOutdated({ installed: current(entry), latest: entry.artifact.version }))
    const proposals = outdated.filter((entry) => {
      const problem = incompatibility(entry.manifest)
      if (problem) {
        logWarn(`Skipped ${entry.id}: ${problem}`)
        // Same as a missing id: Studio would report an update that installed nothing.
        if (wanted.has(entry.id)) process.exitCode = 1
      }
      return !problem
    })

    if (!proposals.length) {
      const title = outdated.length ? 'No compatible updates available' : 'Already up to date'
      summary(tracked.length ? title : 'No installed extensions to update', outdated.length ? 'warning' : 'success', [
        `  ${tracked.length - outdated.length} of ${tracked.length} up to date`,
        ...(ids.length ? ['', `No updates for ${ids.join(', ')}.`] : []),
      ])
      return
    }

    if (tracked.length) {
      const header = ['Extension', 'Current', 'Latest', '']
      const rows = tracked.map((entry) => {
        if (!outdated.includes(entry)) return [entry.artifact.package, current(entry) ?? '-', 'up to date', '']
        const bump = bumpOf({ installed: current(entry), latest: entry.artifact.version }) ?? ''
        return [entry.artifact.package, current(entry) ?? 'not installed', entry.artifact.version, bump === 'major' ? 'major · breaking' : bump]
      })
      const lines = formatTable([header, ...rows])
      logStep(`Checked ${pluralize(tracked.length, 'extension')} against the registry`)
      logBlock([
        styleText('dim', lines[0]!),
        ...lines.slice(1).map((line, index) => {
          if (!outdated.includes(tracked[index]!)) return styleText('dim', line)
          return line.endsWith('major · breaking') ? styleText('yellow', line) : line
        }),
      ])
    }

    if (dryRun) {
      summary('Updates available', 'planned', [`Dry run: nothing was installed. Run kubb update to install ${proposals.length === 1 ? 'it' : 'them'}.`])
      return
    }

    // A major can break the generated code, so it is only picked for you when you named it.
    const defaults = proposals.filter((entry) => wanted.has(entry.id) || !isMajor(entry))
    const chosen = yes
      ? defaults.map((entry) => entry.id)
      : await clack.multiselect({
          message: 'Select the updates to install',
          options: proposals.map((entry) => ({
            value: entry.id,
            label: entry.artifact.package,
            hint: `${current(entry) ?? 'not installed'} → ${entry.artifact.version}`,
          })),
          initialValues: defaults.map((entry) => entry.id),
          required: false,
        })
    if (clack.isCancel(chosen)) {
      summary('Update canceled', 'canceled', ['  No changes made'])
      return
    }
    const selected = proposals.filter((entry) => chosen.includes(entry.id))

    const skipped = proposals
      .filter((entry) => !selected.includes(entry))
      .map((entry) => {
        const kind = pascalCase(entry.manifest.kind)
        return `  ${styleText('dim', 'Skipped')}  ${kind} ${entry.artifact.package} ${entry.artifact.version}  ${styleText('dim', `run kubb update ${toShortId(entry.id)} later`)}`
      })
    if (!selected.length) {
      summary('No updates installed', 'canceled', ['  No updates selected.', ...skipped])
      return
    }

    const packageManager = await detectPackageManager(cwd)
    const names = selected.map(({ artifact }) => artifact.package).join(', ')
    await installWithSpinner({
      packages: selected.map(({ artifact }) => installSpec(artifact)),
      names,
      packageManager,
      cwd,
    })
    installedPackages.push(...selected.map((entry) => entry.artifact.package))

    // Regenerating rewrites output files, so it is asked for. `--yes` only accepts the install.
    const foundConfig = findConfigFile(cwd)
    const regenerateNow =
      foundConfig && !yes && (await clack.confirm({ message: 'Regenerate now? This rewrites the generated files.', initialValue: true })) === true
    const configPath = regenerateNow ? foundConfig : undefined
    const changed = configPath ? await regenerate({ cwd, configPath }) : undefined

    const generationFailed = Boolean(configPath && !changed)
    summary(generationFailed ? 'Extensions updated; generation failed' : 'Update complete', generationFailed ? 'warning' : 'success', [
      `  Packages  ${selected.length} installed with ${packageManager.name}${skipped.length ? ` · ${skipped.length} skipped` : ''}`,
      ...skipped,
      ...(changed ? [`  Files     ${changed.changes.added} added · ${changed.changes.modified} modified · ${changed.changes.deleted} deleted`] : []),
      ...(!configPath ? ['  Regeneration not run'] : []),
      ...(generationFailed ? ['', 'Fix the generation error, then run kubb generate.'] : []),
    ])
  } catch (error) {
    logError(getErrorMessage(error))
    summary('Update failed', 'failed', installedPackages.length ? [`  Packages  ${installedPackages.join(', ')} installed`] : ['  No changes made'])
    process.exitCode = 1
  }
}

export const command = defineWithTypes<{ extensions: DryRunExtensions }>()({
  name: 'update',
  description: 'Update installed extensions, regenerate, and summarize file changes.',
  examples: ['kubb update', 'kubb update --dry-run', 'kubb update plugin-zod plugin-ts --yes'].join('\n'),
  args: {
    ids: {
      type: 'positional',
      description: 'Registry ids to update, all installed extensions when omitted',
      multiple: true,
    },
    ...yesArg,
  },
  run: ({ values, extensions }) => run({ ids: values.ids ?? [], dryRun: extensions[dryRunId].enabled, yes: values.yes }),
})
