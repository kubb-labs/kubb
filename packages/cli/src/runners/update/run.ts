import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { defineWithTypes } from 'gunshi'
import { findConfigFile } from '@internals/shared'
import { getErrorMessage } from '@internals/utils'
import { Hookable, type KubbHooks, readInstalledPackages, type RegistryEntry } from '@kubb/core'
import { pluralize } from '../../loggers/createLogger.ts'
import { dryRunId, type DryRunExtensions, yesArg } from '../../commands/shared.ts'
import {
  createSpinner,
  formatTable,
  isInteractiveRun,
  logBlock,
  logCommandSummary,
  logError,
  logIntro,
  logStep,
  logWarn,
  withSpinner,
} from '../../loggers/output.ts'
import { bumpOf, fetchRegistryIndex, incompatibility, installSpec, isOutdated, registryUrl, toRegistryId, toShortId } from '../../utils/registry.ts'
import { detectPackageManager } from '../init/utils.ts'
import { installWithSpinner } from '../installWithSpinner.ts'
import { diffFiles, type FileChange, readOutputFiles } from '../generate/utils.ts'

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

/**
 * Generates every config in this process, the way `kubb generate` does, and returns the output files
 * it changed. Runs after the install, so the config loads the new versions. `undefined` when the
 * config fails to load or a build fails.
 */
async function regenerate({
  cwd,
  configPath,
}: {
  cwd: string
  configPath: string
}): Promise<{ files: Array<FileChange>; unchanged: number; output: string } | undefined> {
  const spinner = createSpinner()
  spinner.start('Generating with the new versions')
  try {
    // Imported here, so the config loader and the generate path never slow down `kubb --help`.
    const [{ getConfigs }, { generate }] = await Promise.all([import('../../config.ts'), import('../generate/run.ts')])
    const { configs } = await getConfigs({ configPath })
    const dirs = configs.map((config) => path.resolve(config.root ?? cwd, config.output.path))
    const before = new Map((await Promise.all(dirs.map(readOutputFiles))).flatMap((files) => [...files]))
    const hooks = new Hookable<KubbHooks>()
    for (const config of configs) {
      if (!(await generate({ config, hooks }))) throw new Error('Generation failed')
    }
    const after = new Map((await Promise.all(dirs.map(readOutputFiles))).flatMap((files) => [...files]))
    const diff = diffFiles(before, after)
    spinner.stop(diff.files.length ? `Generated: ${pluralize(diff.files.length, 'file')} changed` : 'Generated: no files changed')
    return { ...diff, output: dirs.map((dir) => path.relative(cwd, dir) || '.').join(', ') }
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
  const summary = (title: string, status: Parameters<typeof logCommandSummary>[0]['status'], lines: ReadonlyArray<string>) =>
    logCommandSummary({ title, status, hrStart, block: true, lines })
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
      if (!tracked.some((entry) => entry.id === id)) logWarn(`${id} is not installed, or not in the registry.`)
    }

    const current = ({ artifact }: RegistryEntry) => versions.get(artifact.package)
    const isMajor = (entry: RegistryEntry) => bumpOf({ installed: current(entry), latest: entry.artifact.version }) === 'major'
    const outdated = tracked.filter((entry) => isOutdated({ installed: current(entry), latest: entry.artifact.version }))
    const proposals = outdated.filter((entry) => {
      const problem = incompatibility(entry.manifest)
      if (problem) logWarn(`Skipped ${entry.id}: ${problem}`)
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

    // A major can break the generated code, so it is never picked for you.
    const defaults = proposals.filter((entry) => !isMajor(entry))
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
        const kind = entry.manifest.kind.charAt(0).toUpperCase() + entry.manifest.kind.slice(1)
        return `  ${styleText('dim', 'Skipped')}  ${kind} ${entry.artifact.package} ${entry.artifact.version}  ${styleText('dim', `run kubb update ${toShortId(entry.id)} later`)}`
      })
    if (!selected.length) {
      summary('No updates installed', 'canceled', ['  No updates selected.', ...skipped])
      return
    }

    const packageManager = detectPackageManager(cwd)
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
    const fileCounts = { A: 0, M: 0, D: 0 }
    for (const file of changed?.files ?? []) fileCounts[file.status]++
    summary(generationFailed ? 'Extensions updated; generation failed' : 'Update complete', generationFailed ? 'warning' : 'success', [
      `  Packages  ${selected.length} installed with ${packageManager.name}${skipped.length ? ` · ${skipped.length} skipped` : ''}`,
      ...skipped,
      ...(changed ? [`  Files     ${fileCounts.A} added · ${fileCounts.M} modified · ${fileCounts.D} deleted`] : []),
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
