import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { getErrorMessage } from '@internals/utils'
import type { ExtensionManifest, RegistryDetail } from '@kubb/core'
import { findConfigFile } from '../../config.ts'
import { logBlock, logError, logInfo, logIntro, logOutro, logStep, logWarn } from '../../loggers/output.ts'
import { fetchRegistryDetail, fetchRegistryIndex, incompatibility, installSpec, registryUrl, toRegistryId } from '../../utils/registry.ts'
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

/** The import and the `defineConfig` property to merge into `kubb.config.ts` by hand. */
export function toSnippet({ artifact, manifest }: Pick<RegistryDetail, 'artifact' | 'manifest'>): string {
  const call = `${manifest.export}()`
  const property: Record<ExtensionManifest['kind'], string> = {
    plugin: `plugins: [..., ${call}],`,
    adapter: `adapter: ${call},`,
    parser: `parsers: [..., ${call}],`,
  }
  return [`import { ${manifest.export} } from '${artifact.package}'`, '', property[manifest.kind]].join('\n')
}

/** Adds the plugin call and its import to the config file. Returns why it could not, or `undefined`. */
export async function addToConfig({
  detail,
  configFile,
}: {
  detail: Pick<RegistryDetail, 'artifact' | 'manifest'>
  configFile: string
}): Promise<string | undefined> {
  const { artifact, manifest } = detail
  try {
    const { writeConfigEdits } = await import('@kubb/studio')
    const { outcomes } = await writeConfigEdits({
      filePath: configFile,
      edits: [{ operation: 'add-plugin', plugin: artifact.package }],
      extensions: new Map([[artifact.package, { package: artifact.package, version: artifact.version, manifest }]]),
    })
    return outcomes[0]?.applied ? undefined : (outcomes[0]?.reason ?? 'the config file was not changed')
  } catch (error) {
    return getErrorMessage(error)
  }
}

/** Asks which registry extension to add, searchable by name, id, kind, or description. `undefined` when canceled. */
async function selectExtension(registry: string): Promise<string | undefined> {
  const entries = await fetchRegistryIndex({ registry })
  const kinds: Array<ExtensionManifest['kind']> = ['plugin', 'adapter', 'parser']
  const options = entries
    .toSorted((a, b) => kinds.indexOf(a.kind) - kinds.indexOf(b.kind) || a.id.localeCompare(b.id))
    .map((entry) => ({
      value: entry.id,
      label: entry.manifest.displayName,
      hint: `${entry.id} · ${entry.kind} ${entry.artifact.version} · ${entry.manifest.description}`,
    }))
  if (!options.length) throw new Error(`The registry at ${registry} lists no extensions.`)

  const id = await clack.autocomplete({
    message: 'Select an extension to add:',
    placeholder: 'Type to search',
    options,
    maxItems: 10,
    filter: (search, option) => `${option.label} ${option.hint}`.toLowerCase().includes(search.toLowerCase()),
  })
  return clack.isCancel(id) ? undefined : id
}

/**
 * Installs an extension from the Kubb registry at its reviewed version and, for a plugin, adds it to
 * `kubb.config.ts`. Without an id, asks which one. Refuses when the running Kubb or Node.js version
 * is outside its compatibility.
 */
export async function run({ id: input, configPath, yes, install }: AddOptions): Promise<void> {
  const cwd = process.cwd()
  logIntro({ title: styleText('bgCyan', styleText('black', ' Kubb Add ')) })

  try {
    const registry = registryUrl()
    if (!input && yes) throw new Error('Pass a registry id, such as plugin-zod, when using --yes.')
    const id = input ? toRegistryId(input) : await selectExtension(registry)
    if (!id) {
      clack.cancel('Operation canceled.')
      return
    }
    const detail = await fetchRegistryDetail({ id, registry })
    const { artifact, manifest } = detail

    const problem = incompatibility(manifest)
    if (problem) throw new Error(problem)

    const spec = installSpec(artifact)
    const configFile = manifest.kind === 'plugin' ? (configPath ? path.resolve(configPath) : findConfigFile(cwd)) : undefined
    if (manifest.kind === 'plugin' && !configFile) throw new Error('No kubb.config.ts found. Run `kubb init` first, or pass --config.')

    logInfo(`${styleText('cyan', manifest.displayName)} (${manifest.kind}): ${manifest.description}`)
    logBlock([
      install ? `Install ${styleText('cyan', spec)} as a dev dependency` : `Skip installing ${spec}`,
      configFile
        ? `Add ${styleText('cyan', `${manifest.export}()`)} to ${path.relative(cwd, configFile) || configFile}`
        : `Print the ${manifest.kind} snippet to add`,
    ])

    const confirmed = yes || (await clack.confirm({ message: 'Continue?', initialValue: true }))
    if (clack.isCancel(confirmed) || !confirmed) {
      clack.cancel('Operation canceled.')
      return
    }

    if (install) {
      const packageManager = detectPackageManager(cwd)
      logStep(`Installing ${spec} with ${packageManager.name}`)
      await installPackages([spec], packageManager, cwd)
    }

    const reason = configFile ? await addToConfig({ detail, configFile }) : `add the ${manifest.kind} to your config`
    if (!reason) {
      logOutro(styleText('green', install ? `Added ${spec}` : `Added ${manifest.export}() to the config. Install ${spec} to use it.`))
      return
    }

    if (configFile) logWarn(`Could not edit ${configFile}: ${reason}`)
    logBlock(['Add the import to your Kubb config and merge the property into its defineConfig call:', '', toSnippet(detail)])
    logOutro(styleText('green', install ? `Installed ${spec}. Add it with the snippet above.` : `Install ${spec} and add the snippet above.`))
  } catch (error) {
    logError(getErrorMessage(error))
    process.exitCode = 1
  }
}
