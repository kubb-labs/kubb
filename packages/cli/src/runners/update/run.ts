import { hash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { define } from 'gunshi'
import { findConfigFile } from '@internals/shared'
import { formatMs, getElapsedMs, getErrorMessage } from '@internals/utils'
import { Hookable, type KubbHooks, readInstalledPackages, type RegistryEntry } from '@kubb/core'
import { yesArg } from '../../commands/shared.ts'
import { createSpinner, logBlock, logError, logIntro, logOutro, logStep, logWarn, withSpinner } from '../../loggers/output.ts'
import { bumpOf, fetchRegistryIndex, incompatibility, installSpec, isOutdated, registryUrl, toRegistryId, toShortId } from '../../utils/registry.ts'
import { detectPackageManager, installPackages } from '../init/utils.ts'

export type UpdateOptions = {
  /**
   * Registry ids to update. Empty updates every installed extension the registry lists.
   */
  ids: Array<string>
  check: boolean
  yes: boolean
}

/** How many changed files the summary lists before it counts the rest. */
const MAX_CHANGED_FILES = 10

/** Pads each column to its widest cell. */
function toTable(rows: Array<Array<string>>): Array<string> {
  const widths = rows[0]!.map((_, index) => Math.max(...rows.map((row) => row[index]?.length ?? 0)))
  return rows.map((row) =>
    row
      .map((cell, index) => cell.padEnd(widths[index]!))
      .join('  ')
      .trimEnd(),
  )
}

/** The hash of every file under `dirs`, by path. A missing folder holds nothing. */
async function snapshot(dirs: Array<string>): Promise<Map<string, string>> {
  const files = await Promise.all(
    dirs.map(async (dir) => {
      const entries = await readdir(dir, { recursive: true, withFileTypes: true }).catch(() => [])
      return Promise.all(
        entries
          .filter((entry) => entry.isFile())
          .map(async (entry) => {
            const file = path.join(entry.parentPath, entry.name)
            return [file, hash('sha1', await readFile(file))] as const
          }),
      )
    }),
  )
  return new Map(files.flat())
}

/** `M`, `A`, or `D` and the path relative to `cwd` of each file that differs between two snapshots, sorted by path. */
export function changedFiles({ before, after, cwd }: { before: Map<string, string>; after: Map<string, string>; cwd: string }): Array<string> {
  return [...new Set([...before.keys(), ...after.keys()])].toSorted().flatMap((file) => {
    const name = path.relative(cwd, file)
    if (!after.has(file)) return [`D ${name}`]
    if (!before.has(file)) return [`A ${name}`]
    return before.get(file) === after.get(file) ? [] : [`M ${name}`]
  })
}

/**
 * Generates every config in this process, the way `kubb generate` does, and returns the output files
 * it changed. Runs after the install, so the config loads the new versions. `undefined` when the
 * config fails to load or a build fails.
 */
async function regenerate({ cwd, configPath }: { cwd: string; configPath: string }): Promise<Array<string> | undefined> {
  try {
    // Imported here, so the config loader and the generate path never slow down `kubb --help`.
    const [{ getConfigs }, { generate }] = await Promise.all([import('../../config.ts'), import('../generate/run.ts')])
    const { configs } = await getConfigs({ configPath })
    const dirs = configs.map((config) => path.resolve(config.root ?? cwd, config.output.path))
    const before = await snapshot(dirs)
    const hooks = new Hookable<KubbHooks>()
    for (const config of configs) {
      if (!(await generate({ config, hooks }))) return undefined
    }
    return changedFiles({ before, after: await snapshot(dirs), cwd })
  } catch {
    return undefined
  }
}

/**
 * Moves installed extensions to the version the registry pins. Shows each version change with its
 * bump, asks which to install with majors left out, installs them, and regenerates to show which
 * files changed. With `check`, only lists the updates and exits with code 1 when there are any.
 */
export async function run({ ids, check, yes }: UpdateOptions): Promise<void> {
  const cwd = process.cwd()
  logIntro({ title: styleText('bgCyan', styleText('black', ' Kubb Update ')) })

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

    if (check) {
      if (!proposals.length) {
        logOutro(ids.length ? `No updates for ${ids.join(', ')}.` : 'Every installed extension is up to date.')
        return
      }
      const majors = proposals.filter(isMajor).length
      const plural = proposals.length === 1 ? '' : 's'
      logBlock([
        `${proposals.length} update${plural} available${majors ? ` (${majors} major)` : ''}`,
        ...toTable(
          proposals.map((entry) => [entry.artifact.package, `${current(entry) ?? 'not installed'} → ${entry.artifact.version}`, isMajor(entry) ? 'major' : '']),
        ),
      ])
      logOutro('Run kubb update to install them.')
      process.exitCode = 1
      return
    }

    if (tracked.length) {
      const header = ['Extension', 'Current', 'Latest', '']
      const rows = tracked.map((entry) => {
        if (!outdated.includes(entry)) return [entry.artifact.package, current(entry) ?? '-', 'up to date', '']
        const bump = bumpOf({ installed: current(entry), latest: entry.artifact.version }) ?? ''
        return [entry.artifact.package, current(entry) ?? 'not installed', entry.artifact.version, bump === 'major' ? 'major · breaking' : bump]
      })
      const lines = toTable([header, ...rows])
      logStep(`Checked ${tracked.length} extension${tracked.length === 1 ? '' : 's'} against the registry`)
      logBlock([
        styleText('dim', lines[0]!),
        ...lines.slice(1).map((line, index) => {
          if (!outdated.includes(tracked[index]!)) return styleText('dim', line)
          return line.endsWith('major · breaking') ? styleText('yellow', line) : line
        }),
      ])
    }

    if (!proposals.length) {
      logOutro(ids.length ? `No updates for ${ids.join(', ')}.` : 'Every installed extension is up to date.')
      return
    }

    // A major can break the generated code, so it is never picked for you.
    const defaults = proposals.filter((entry) => !isMajor(entry))
    const selected = await (async () => {
      if (yes) return defaults
      const chosen = await clack.multiselect({
        message: 'Select the updates to install',
        options: proposals.map((entry) => ({
          value: entry.id,
          label: `${entry.artifact.package} ${entry.artifact.version}`,
          hint: `${current(entry) ?? 'not installed'} → ${entry.artifact.version}`,
        })),
        initialValues: defaults.map((entry) => entry.id),
        required: false,
      })
      return clack.isCancel(chosen) ? undefined : proposals.filter((entry) => chosen.includes(entry.id))
    })()
    if (!selected) {
      clack.cancel('Operation canceled.')
      return
    }

    const skipped = proposals
      .filter((entry) => !selected.includes(entry))
      .map((entry) => `Skipped  ${entry.artifact.package} ${entry.artifact.version}  ${styleText('dim', `run kubb update ${toShortId(entry.id)} later`)}`)
    if (!selected.length) {
      logOutro(['No updates selected.', ...skipped].join('\n'))
      return
    }

    const packageManager = detectPackageManager(cwd)
    const names = selected.map(({ artifact }) => artifact.package).join(', ')
    const spinner = createSpinner()
    const hrStart = process.hrtime()
    spinner.start(`Installing ${names} with ${packageManager.name}`)
    try {
      await installPackages(
        selected.map(({ artifact }) => installSpec(artifact)),
        packageManager,
        cwd,
      )
    } catch (error) {
      spinner.error('Install failed')
      throw error
    }
    spinner.stop(`Installed ${names} with ${packageManager.name} in ${formatMs(getElapsedMs(hrStart))}`)

    const configPath = findConfigFile(cwd)
    if (configPath) {
      const generation = createSpinner()
      generation.start('Generating with the new versions')
      const changed = await regenerate({ cwd, configPath })
      if (!changed) generation.error('Generation failed. Run kubb generate to see why.')
      if (changed)
        generation.stop(changed.length ? `Generated: ${changed.length} file${changed.length === 1 ? '' : 's'} changed` : 'Generated: no files changed')
      if (changed?.length)
        logBlock([
          ...changed.slice(0, MAX_CHANGED_FILES),
          ...(changed.length > MAX_CHANGED_FILES ? [styleText('dim', `and ${changed.length - MAX_CHANGED_FILES} more`)] : []),
        ])
    }

    logOutro([styleText('green', `✓ Updated ${selected.length} extension${selected.length === 1 ? '' : 's'}`), ...skipped].join('\n'))
  } catch (error) {
    logError(getErrorMessage(error))
    process.exitCode = 1
  }
}

export const command = define({
  name: 'update',
  description:
    'Update installed extensions to the version the Kubb registry pins, then regenerate and list the changed files. Majors are left unselected. Pass ids to update only those, or --check to list the updates and exit with code 1 when there are any.',
  examples: ['kubb update', 'kubb update --check', 'kubb update plugin-zod plugin-ts --yes'].join('\n'),
  args: {
    ids: {
      type: 'positional',
      description: 'Registry ids to update, all installed extensions when omitted',
      multiple: true,
    },
    check: {
      type: 'boolean',
      description: 'List the available updates without installing them. Exits with code 1 when there are any',
      default: false,
    },
    ...yesArg,
  },
  run: ({ values }) => run({ ids: values.ids ?? [], check: values.check, yes: values.yes }),
})
