import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { define } from 'gunshi'
import { findConfigFile } from '@internals/shared'
import { formatMs, getElapsedMs, getErrorMessage } from '@internals/utils'
import { Diagnostics, type ExtensionManifest, readInstalledPackages, type RegistryDetail, type RegistryEntry } from '@kubb/core'
import { configArg, yesArg } from '../../commands/shared.ts'
import { createSpinner, logBlock, logError, logIntro, logOutro, logStep, logWarn, withSpinner } from '../../loggers/output.ts'
import { closestIds, fetchRegistryIndex, incompatibility, installSpec, registryUrl, toRegistryId, toShortId } from '../../utils/registry.ts'
import { detectPackageManager, installPackages } from '../init/utils.ts'

export type AddOptions = {
  /**
   * `owner/slug`, or a bare `slug` for an official extension. Asked for when omitted.
   */
  id?: string
  configPath?: string
  yes: boolean
  install: boolean
}

type ConfigTarget = Pick<RegistryDetail, 'artifact' | 'manifest'>

/** The import and the `defineConfig` property to merge into `kubb.config.ts` by hand. */
export function toSnippet({ artifact, manifest }: ConfigTarget): string {
  const call = `${manifest.export}()`
  const property: Record<ExtensionManifest['kind'], string> = {
    plugin: `plugins: [..., ${call}],`,
    adapter: `adapter: ${call},`,
    parser: `parsers: [..., ${call}],`,
  }
  return [`import { ${manifest.export} } from '${artifact.package}'`, '', property[manifest.kind]].join('\n')
}

/** The `add-plugin` edits for `details`, and the manifests the edits read their export names from. */
function toConfigEdits(details: Array<ConfigTarget>) {
  return {
    edits: details.map(({ artifact }) => ({ operation: 'add-plugin' as const, plugin: artifact.package })),
    extensions: new Map(details.map(({ artifact, manifest }) => [artifact.package, { package: artifact.package, version: artifact.version, manifest }])),
  }
}

/** Adds the plugin call and its import to the config file. Returns why it could not, or `undefined`. */
export async function addToConfig({ detail, configFile }: { detail: ConfigTarget; configFile: string }): Promise<string | undefined> {
  try {
    const { writeConfigEdits } = await import('@kubb/studio')
    const { outcomes } = await writeConfigEdits({ filePath: configFile, ...toConfigEdits([detail]) })
    return outcomes[0]?.applied ? undefined : (outcomes[0]?.reason ?? 'the config file was not changed')
  } catch (error) {
    return getErrorMessage(error)
  }
}

/** The lines adding `details` would put in the config `source`, trimmed, or why it could not add them. */
async function previewConfig({ details, source }: { details: Array<ConfigTarget>; source: string }): Promise<{ lines: Array<string> } | { reason: string }> {
  try {
    const { applyConfigEdits } = await import('@kubb/studio')
    const result = applyConfigEdits({ source, ...toConfigEdits(details) })
    const failed = result.outcomes.find((outcome) => !outcome.applied)
    if (failed) return { reason: failed.reason ?? 'the config file was not changed' }
    const remaining = source.split('\n')
    const lines = result.source.split('\n').filter((line) => {
      const index = remaining.indexOf(line)
      if (index !== -1) remaining.splice(index, 1)
      return index === -1
    })
    return { lines: lines.map((line) => line.trim()) }
  } catch (error) {
    return { reason: getErrorMessage(error) }
  }
}

// shortcut: reads the first `output: { path }` in the source, so a config that builds it in code shows no path; load the config when that matters.
function outputPathOf(source: string | undefined): string | undefined {
  return source?.match(/output:\s*\{[^}]*?path:\s*['"]([^'"]+)['"]/)?.[1]
}

async function selectExtension({
  entries,
  versions,
  registry,
}: {
  entries: Array<RegistryEntry>
  versions: Map<string, unknown>
  registry: string
}): Promise<string | undefined> {
  if (!entries.length)
    throw new Diagnostics.Error({
      code: Diagnostics.code.unknown,
      severity: 'error',
      message: `The registry at ${registry} lists no extensions.`,
      help: 'Check that `KUBB_REGISTRY` points at a Kubb registry, or unset it to use https://kubb.dev/registry.',
    })

  // Filters in memory, so typing never waits on the network.
  const searchText = new Map(entries.map((entry) => [entry.id, `${entry.id} ${entry.manifest.displayName} ${entry.manifest.description}`.toLowerCase()]))
  const options = entries
    .toSorted((a, b) => a.id.localeCompare(b.id))
    .map((entry) => {
      const installed = versions.has(entry.artifact.package)
      return { value: entry.id, label: toShortId(entry.id), hint: installed ? 'installed' : summarize(entry.manifest.description), disabled: installed }
    })

  const id = await clack.autocomplete({
    message: `Add an extension · ${entries.length} in the registry`,
    placeholder: 'Search',
    options,
    filter: (search, option) => searchText.get(option.value)?.includes(search.toLowerCase()) ?? false,
  })
  return clack.isCancel(id) ? undefined : id
}

/** Reports an id the registry does not list, with the closest ids to try instead. */
function logUnknown({ input, id, entries }: { input: string; id: string; entries: Array<RegistryEntry> }): void {
  const suggestions = closestIds({ input: id, ids: entries.map((entry) => entry.id) }).map(toShortId)
  logError(`No extension named ${input} in the registry`)
  logBlock([
    ...(suggestions.length ? [`Did you mean ${styleText('cyan', suggestions[0]!)}?`, ...suggestions.map((suggestion) => `  kubb add ${suggestion}`), ''] : []),
    `Browse all  ${styleText('cyan', 'kubb.dev/extensions')}`,
  ])
  process.exitCode = 1
}

/** Asks whether to also add the required plugins the config lacks. `--yes` adds them. */
async function confirmDependencies({
  entry,
  missing,
  yes,
}: {
  entry: RegistryEntry
  missing: Array<RegistryEntry>
  yes: boolean
}): Promise<boolean | undefined> {
  if (!missing.length || yes) return true
  const names = missing.map((dependency) => dependency.manifest.name).join(', ')
  const answer = await clack.select({
    message: `${entry.manifest.name} needs ${names}. Add ${names} as well?`,
    options: [
      { value: true, label: `Yes, add ${missing.length === 1 ? 'both' : 'all'}`, hint: 'recommended' },
      { value: false, label: `Only ${entry.manifest.name}`, hint: 'generate fails until you add it' },
    ],
    initialValue: true,
  })
  return clack.isCancel(answer) ? undefined : answer
}

/** The first sentence of a registry description, cut to one terminal line. */
export function summarize(description: string, max = 64): string {
  const sentence = description.split(/\.\s/)[0]!.replace(/\.$/, '')
  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence
}

/**
 * Installs an extension from the Kubb registry at its reviewed version and, for a plugin, adds it to
 * `kubb.config.ts`, offering to add the plugins it needs as well. Without an id, asks which one.
 * Previews the packages and config lines before asking. Refuses when the running Kubb or Node.js
 * version is outside its compatibility.
 */
export async function run({ id: input, configPath, yes, install }: AddOptions): Promise<void> {
  const cwd = process.cwd()
  logIntro({ title: styleText('bgCyan', styleText('black', ' Kubb Add ')) })

  try {
    const registry = registryUrl()
    if (!input && yes)
      throw new Diagnostics.Error({
        code: Diagnostics.code.unknown,
        severity: 'error',
        message: 'Pass a registry id, such as plugin-zod, when using --yes.',
        help: 'Run `kubb add plugin-zod --yes`, or drop `--yes` to pick from a list.',
      })
    const inputId = input ? toRegistryId(input) : undefined
    const foundConfig = configPath ? path.resolve(configPath) : findConfigFile(cwd)
    const [entries, installed, configSource] = await withSpinner({
      message: 'Reading the registry',
      promise: Promise.all([
        fetchRegistryIndex({ registry }),
        readInstalledPackages({ root: cwd }),
        foundConfig ? readFile(foundConfig, 'utf8').catch(() => undefined) : undefined,
      ]),
    })
    const versions = new Map(installed.map((item) => [item.package, item.version]))

    const id = inputId ?? (await selectExtension({ entries, versions, registry }))
    if (!id) {
      clack.cancel('Operation canceled.')
      return
    }
    const entry = entries.find((candidate) => candidate.id === id)
    if (!entry) {
      logUnknown({ input: input ?? id, id, entries })
      return
    }
    const { artifact, manifest } = entry

    const problem = incompatibility(manifest)
    if (problem)
      throw new Diagnostics.Error({
        code: Diagnostics.code.incompatibleExtension,
        severity: 'error',
        message: problem,
        help: 'Upgrade Kubb or Node.js to a version the extension supports.',
      })

    const configFile = manifest.kind === 'plugin' ? foundConfig : undefined
    if (manifest.kind === 'plugin' && !configFile)
      throw new Diagnostics.Error({
        code: Diagnostics.code.unknown,
        severity: 'error',
        message: 'No kubb.config.ts found. Run `kubb init` first, or pass --config.',
        help: 'Run `kubb init` to create a config, or pass its path with `--config`.',
      })
    const configName = configFile ? path.relative(cwd, configFile) || configFile : undefined

    const byName = new Map(entries.map((candidate) => [candidate.manifest.name, candidate]))
    const inConfig = (name: string) => {
      const dependency = byName.get(name)
      return dependency ? !!configSource?.includes(`${dependency.manifest.export}(`) : installed.some((item) => item.manifest?.name === name)
    }
    const dependencies = manifest.dependencies ?? []
    const missing = configFile ? dependencies.filter((name) => !inConfig(name)).flatMap((name) => byName.get(name) ?? []) : []
    const withDependencies = await confirmDependencies({ entry, missing, yes })
    if (withDependencies === undefined) {
      clack.cancel('Operation canceled.')
      return
    }
    const targets = [...(withDependencies ? missing : []), entry]
    const specs = targets.filter((target) => target === entry || !versions.has(target.artifact.package)).map((target) => installSpec(target.artifact))

    const dependencyStatus = (name: string) => {
      if (inConfig(name)) return `${name} ${styleText('green', '✓ installed')}`
      return targets.some((target) => target.manifest.name === name) ? `${name} ${styleText('cyan', '+ adding')}` : `${name} ${styleText('yellow', 'missing')}`
    }
    const preview = configFile && configSource !== undefined ? await previewConfig({ details: targets, source: configSource }) : undefined
    logStep(`${styleText('cyan', manifest.name)} v${artifact.version} · ${summarize(manifest.description)}`)
    logBlock([
      ...(dependencies.length ? [`Needs     ${dependencies.map(dependencyStatus).join('  ')}`] : []),
      install ? `Installs  ${specs.join('  ')}` : 'Installs  nothing (--no-install)',
      ...(configName ? [`Config    ${configName}`] : [`Config    prints the ${manifest.kind} snippet to add`]),
      ...(preview && 'lines' in preview ? preview.lines.map((line) => styleText('green', `  + ${line}`)) : []),
      ...(preview && 'reason' in preview ? [styleText('yellow', `  cannot edit it: ${preview.reason}`)] : []),
    ])

    const confirmed = yes || (await clack.confirm({ message: 'Add it?', initialValue: true }))
    if (clack.isCancel(confirmed) || !confirmed) {
      clack.cancel('Operation canceled.')
      return
    }

    if (install) {
      const packageManager = detectPackageManager(cwd)
      const names = targets.filter((target) => specs.includes(installSpec(target.artifact))).map((target) => target.artifact.package)
      const spinner = createSpinner()
      const hrStart = process.hrtime()
      spinner.start(`Installing ${names.join(', ')} with ${packageManager.name}`)
      try {
        await installPackages(specs, packageManager, cwd)
      } catch (error) {
        spinner.error('Install failed')
        throw error
      }
      spinner.stop(`Installed ${names.join(', ')} with ${packageManager.name} in ${formatMs(getElapsedMs(hrStart))}`)
    }

    const unconfigured: Array<RegistryEntry> = configFile ? [] : [entry]
    if (configFile) {
      for (const target of targets) {
        const reason = await addToConfig({ detail: target, configFile })
        if (reason) {
          logWarn(`Could not edit ${configName}: ${reason}`)
          unconfigured.push(target)
          continue
        }
        logStep(`Added ${target.manifest.export}() to ${configName}`)
      }
    }

    if (!unconfigured.length) {
      const outputPath = outputPathOf(configSource)
      logOutro(
        [
          styleText('green', `✓ ${manifest.name} is ready`),
          `   ${styleText('dim', 'Next')}     kubb generate${outputPath ? styleText('dim', `  creates ${outputPath}`) : ''}`,
          `   ${styleText('dim', 'Options')}  kubb.dev/extensions/${entry.id}`,
          ...(install ? [] : [styleText('dim', `Install ${specs.join(' ')} to use it.`)]),
        ].join('\n'),
      )
      return
    }

    logBlock(['Add the import to your Kubb config and merge the property into its defineConfig call:', '', ...unconfigured.map((target) => toSnippet(target))])
    logOutro(
      styleText('green', install ? `Installed ${specs.join(' ')}. Add it with the snippet above.` : `Install ${specs.join(' ')} and add the snippet above.`),
    )
  } catch (error) {
    logError(getErrorMessage(error))
    process.exitCode = 1
  }
}

export const command = define({
  name: 'add',
  description:
    'Install a plugin, adapter, or parser from the Kubb registry at its reviewed version. Without an id, search the registry. Shows the packages and config lines before asking, and offers to add the plugins it needs. A plugin is added to kubb.config.ts, an adapter or parser prints the code to add. Reads KUBB_REGISTRY to use another registry.',
  examples: [
    'kubb add',
    'kubb add plugin-zod',
    'kubb add kubb-labs/plugin-react-query',
    'kubb add acme/plugin-x --yes',
    'kubb add plugin-zod --no-install',
  ].join('\n'),
  toKebab: true,
  args: {
    id: {
      type: 'positional',
      description: 'Registry id: owner/slug, or a slug for an official extension. Asked for when omitted',
      required: false,
    },
    ...configArg,
    ...yesArg,
    install: {
      type: 'boolean',
      description: 'Install the package. Pass --no-install to only edit the config',
      negatable: true,
      default: true,
    },
  },
  run: ({ values }) => run({ id: values.id, configPath: values.config, yes: values.yes, install: values.install }),
})
