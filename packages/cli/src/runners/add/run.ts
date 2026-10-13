import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { getErrorMessage } from '@internals/utils'
import type { ExtensionManifest, RegistryDetail } from '@kubb/core'
import { findConfigFile } from '../../config.ts'
import { logBlock, logError, logInfo, logIntro, logOutro, logStep, logWarn } from '../../loggers/output.ts'
import { fetchRegistryDetail, incompatibility, installSpec, registryUrl, toRegistryId } from '../../utils/registry.ts'
import { detectPackageManager, installPackages } from '../init/utils.ts'

export type AddOptions = {
  /**
   * `owner/slug`, or a bare `slug` for an official extension.
   */
  id: string
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
async function addToConfig({ detail, configFile }: { detail: RegistryDetail; configFile: string }): Promise<string | undefined> {
  const { artifact, manifest } = detail
  try {
    const { writeConfigEdits } = await import('@kubb/studio')
    const { outcomes } = await writeConfigEdits({
      filePath: configFile,
      edits: [{ operation: 'add-plugin', plugin: artifact.package, importName: manifest.export }],
      extensions: new Map([[artifact.package, { package: artifact.package, version: artifact.version, manifest }]]),
    })
    return outcomes[0]?.applied ? undefined : (outcomes[0]?.reason ?? 'the config file was not changed')
  } catch (error) {
    return getErrorMessage(error)
  }
}

/**
 * Installs an extension from the Kubb registry at its reviewed version and, for a plugin, adds it to
 * `kubb.config.ts`. Refuses when the running Kubb or Node.js version is outside its compatibility.
 */
export async function run({ id: input, configPath, yes, install }: AddOptions): Promise<void> {
  const cwd = process.cwd()
  logIntro({ title: styleText('bgCyan', styleText('black', ' Kubb Add ')) })

  try {
    const registry = registryUrl()
    const detail = await fetchRegistryDetail({ id: toRegistryId(input), registry })
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
