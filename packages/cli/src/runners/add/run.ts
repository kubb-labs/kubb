import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { define } from 'gunshi'
import { BUNDLED_PACKAGES, ConfigEditOperation, extensionKinds, editConfig, editConfigFile, findConfigFile, readImports } from '@internals/shared'
import { getErrorMessage, pascalCase, read } from '@internals/utils'
import { Diagnostics, type ExtensionManifest, readInstalledPackages, type RegistryDetail, type RegistryEntry } from '@kubb/core'
import { configArg, yesArg } from '../../commands/shared.ts'
import { isInteractiveRun, logIntro } from '../../ui/intro.ts'
import { logBlock, logError, logStep, logWarn } from '../../ui/log.ts'
import { withSpinner } from '../../ui/spinner.ts'
import { createSummary } from '../../ui/summary.ts'
import { closestIds, fetchRegistryIndex, incompatibility, installSpec, registryUrl, toRegistryId, toShortId } from '../../utils/registry.ts'
import { detectPackageManager } from '../init/utils.ts'
import { installWithSpinner } from '../installWithSpinner.ts'

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
function toSnippet({ artifact, manifest }: ConfigTarget): string {
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
    edits: details.map(({ artifact, manifest }) => ({
      operation: ConfigEditOperation.ADD_PLUGIN,
      ...(manifest.kind === extensionKinds.parser ? { kind: extensionKinds.parser } : {}),
      plugin: artifact.package,
    })),
    extensions: new Map(details.map(({ artifact, manifest }) => [artifact.package, { package: artifact.package, version: artifact.version, manifest }])),
  }
}

/** The lines adding `details` would put in the config `source`, trimmed, or why it could not add them. */
function previewConfig({ details, source }: { details: Array<ConfigTarget>; source: string }): { lines: Array<string>; source: string } | { reason: string } {
  const result = editConfig({ source, ...toConfigEdits(details) })
  const failed = result.outcomes.find((outcome) => !outcome.applied)
  if (failed) return { reason: failed.reason ?? 'the config file was not changed' }
  const remaining = source.split('\n')
  const lines = result.source.split('\n').filter((line) => {
    const index = remaining.indexOf(line)
    if (index !== -1) remaining.splice(index, 1)
    return index === -1
  })
  return { lines: lines.map((line) => line.trim()), source: result.source }
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
 * Installs an extension from the Kubb registry at its reviewed version and, for a plugin or a parser,
 * adds it to `kubb.config.ts`, offering to add the plugins it needs as well. An adapter is never
 * written: the command prints the snippet to swap it in by hand. Without an id, asks which one.
 * Previews the packages and config lines before asking. Refuses when the running Kubb or Node.js
 * version is outside its compatibility.
 */
export async function run({ id: input, configPath, yes, install }: AddOptions): Promise<void> {
  const cwd = process.cwd()
  const hrStart = process.hrtime()
  const summary = createSummary(hrStart)
  const installedPackages: Array<string> = []
  const configured: Array<RegistryEntry> = []
  logIntro({ title: isInteractiveRun({ yes }) ? undefined : styleText('bgCyan', styleText('black', ' Kubb Add ')) })

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
        foundConfig ? read(foundConfig).catch(() => undefined) : undefined,
      ]),
    })
    const versions = new Map(installed.map((item) => [item.package, item.version]))

    const id = inputId ?? (await selectExtension({ entries, versions, registry }))
    if (!id) {
      summary('Add canceled', 'canceled', ['  No changes made'])
      return
    }
    const entry = entries.find((candidate) => candidate.id === id)
    if (!entry) {
      const suggestions = closestIds({ input: id, ids: entries.map((entry) => entry.id) }).map(toShortId)
      summary(`No extension named ${input ?? id}`, 'failed', [
        ...suggestions.map((suggestion) => `  kubb add ${suggestion}`),
        '  Browse all  kubb.dev/extensions',
      ])
      process.exitCode = 1
      return
    }
    const { artifact, manifest } = entry
    const kind = pascalCase(manifest.kind)

    const problem = incompatibility(manifest)
    if (problem)
      throw new Diagnostics.Error({
        code: Diagnostics.code.incompatibleExtension,
        severity: 'error',
        message: problem,
        help: 'Upgrade Kubb or Node.js to a version the extension supports.',
      })

    const configFile = manifest.kind === extensionKinds.adapter ? undefined : foundConfig
    if (manifest.kind !== extensionKinds.adapter && !configFile)
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
      summary('Add canceled', 'canceled', [`  ${kind}  ${manifest.name}`, '  No changes made'])
      return
    }
    const targets = [...(withDependencies ? missing : []), entry]

    const dependencyStatus = (name: string) => {
      if (inConfig(name)) return `${name} ${styleText('green', '✓ installed')}`
      return targets.some((target) => target.manifest.name === name) ? `${name} ${styleText('cyan', '+ adding')}` : `${name} ${styleText('yellow', 'missing')}`
    }
    const preview = configFile && configSource !== undefined ? previewConfig({ details: targets, source: configSource }) : undefined
    // The default parsers written next to a new parser come with `kubb`. A strict node_modules layout
    // only lets the config import direct dependencies, so they are installed at the project's `kubb` version.
    const before = readImports(configSource ?? '')
    const added = preview && 'lines' in preview ? readImports(preview.source).filter((name) => !before.includes(name)) : []
    const bundled = BUNDLED_PACKAGES.filter(
      (name) => added.includes(name) && !versions.has(name) && !targets.some((target) => target.artifact.package === name),
    )
    const kubbVersion = versions.get('kubb')
    const specs = [
      ...targets.filter((target) => target === entry || !versions.has(target.artifact.package)).map((target) => installSpec(target.artifact)),
      ...bundled.map((name) => (kubbVersion ? `${name}@${kubbVersion}` : name)),
    ]
    logStep(`${kind} ${styleText('cyan', manifest.name)} v${artifact.version} · ${summarize(manifest.description)}`)
    logBlock([
      ...(dependencies.length ? [`Needs     ${dependencies.map(dependencyStatus).join('  ')}`] : []),
      install ? `Installs  ${specs.join('  ')}` : 'Installs  nothing (--no-install)',
      ...(configName ? [`Config    ${configName}`] : [`Config    prints the ${manifest.kind} snippet to add`]),
      ...(preview && 'lines' in preview ? preview.lines.map((line) => styleText('green', `  + ${line}`)) : []),
      ...(preview && 'reason' in preview ? [styleText('yellow', `  cannot edit it: ${preview.reason}`)] : []),
    ])

    const confirmed = yes || (await clack.confirm({ message: 'Add it?', initialValue: true }))
    if (clack.isCancel(confirmed) || !confirmed) {
      summary('Add canceled', 'canceled', [`  ${kind}  ${manifest.name}`, '  No changes made'])
      return
    }

    const packageManager = await detectPackageManager(cwd)
    const packages = () => (install ? `${installedPackages.length} installed with ${packageManager.name}` : 'installation skipped (--no-install)')
    if (install) {
      const names = [...targets.filter((target) => specs.includes(installSpec(target.artifact))).map((target) => target.artifact.package), ...bundled]
      await installWithSpinner({ packages: specs, names: names.join(', '), packageManager, cwd })
      installedPackages.push(...names)
    }

    const unconfigured: Array<RegistryEntry> = configFile ? [] : [entry]
    if (configFile) {
      for (const target of targets) {
        try {
          const { outcomes, changed } = await editConfigFile({ filePath: configFile, ...toConfigEdits([target]) })
          if (!outcomes[0]?.applied) throw new Error(outcomes[0]?.reason ?? 'the config file was not changed')
          if (changed) configured.push(target)
          logStep(`${target.manifest.export}() configured in ${configName}`)
        } catch (error) {
          logWarn(`Could not edit ${configName}: ${getErrorMessage(error)}`)
          unconfigured.push(target)
        }
      }
    }

    const manual = unconfigured.length > 0
    // A plugin or parser the command could not write into the config is a failure a caller can act on; an adapter never gets written.
    if (manual && manifest.kind !== extensionKinds.adapter) process.exitCode = 1
    if (manual)
      logBlock([
        'Add the import to your Kubb config and merge the property into its defineConfig call:',
        '',
        ...unconfigured.map((target) => toSnippet(target)),
      ])
    const dependenciesMissing = !withDependencies && missing.length > 0
    const title = manual
      ? `${kind} needs configuration`
      : dependenciesMissing
        ? 'Plugin configured; dependencies missing'
        : configured.length
          ? install
            ? `${kind} ready`
            : `${kind} configured`
          : `${kind} already configured`
    summary(title, manual || dependenciesMissing ? 'warning' : 'success', [
      `  Packages  ${packages()}`,
      ...configured.map((target) => styleText('green', `  + ${target.manifest.export}()`)),
      '',
      ...(!install ? [`Install ${specs.join(' ')} to use it.`] : []),
      ...(dependenciesMissing ? [`Missing plugins  ${missing.map((target) => target.manifest.name).join(', ')}`] : []),
      manual ? 'Add the snippet above, then run kubb generate.' : 'Next     kubb generate',
      `Options  kubb.dev/extensions/${entry.id}`,
    ])
  } catch (error) {
    logError(getErrorMessage(error))
    summary('Add failed', 'failed', installedPackages.length ? [`  Packages  ${installedPackages.join(', ')} installed`] : ['  No changes made'])
    process.exitCode = 1
  }
}

export const command = define({
  name: 'add',
  description: 'Find and install plugins, adapters, and parsers from the Kubb registry.',
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
