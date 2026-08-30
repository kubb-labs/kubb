import { applyConfigEdits } from './configPatch.ts'
import { availablePlugins, KUBB_PACKAGE_NAME } from './constants.ts'
import type { PluginOption } from './types.ts'

/**
 * Resolves a comma-separated plugin flag (e.g. `--plugins plugin-ts,plugin-zod`) into the
 * matching known plugin options. Unrecognized names are dropped, and a missing flag yields
 * an empty list.
 */
export function resolvePlugins(pluginsFlag: string | undefined): Array<PluginOption> {
  if (!pluginsFlag) {
    return []
  }
  const requested = pluginsFlag
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return availablePlugins.filter((plugin) => requested.includes(plugin.value))
}

export function generateConfigFile({
  selectedPlugins,
  inputPath,
  outputPath,
}: {
  selectedPlugins: Array<PluginOption>
  inputPath: string
  outputPath: string
}): string {
  const imports = selectedPlugins.map((plugin) => `import { ${plugin.importName} } from '${plugin.packageName}'`).join('\n')

  const pluginConfigs = selectedPlugins.map((plugin) => `    ${plugin.importName}(),`).join('\n')

  return `import { defineConfig } from 'kubb/config'
${imports}

export default defineConfig({
  input: '${inputPath}',
  output: {
    path: '${outputPath}',
    clean: true,
  },
  plugins: [
${pluginConfigs}
  ],
})
`
}

/**
 * Turns package names into install specifiers for the wizard.
 *
 * `kubb` is pinned to the exact version of the running CLI, since both ship from the same release
 * and resolving `kubb@beta` separately can land on a different version than the CLI doing the
 * scaffolding. Plugins release from their own repo on their own cadence, so they follow the
 * release channel of the CLI through its dist-tag.
 */
export function resolveInstallVersions({ packages, version }: { packages: Array<string>; version: string }): Array<string> {
  const prerelease = version.match(/-([a-z]+)/)?.[1]
  const tag = prerelease ?? 'latest'

  return packages.map((name) => (name === KUBB_PACKAGE_NAME ? `${name}@${version}` : `${name}@${tag}`))
}

/**
 * Adds the selected plugins to an existing `kubb.config.ts` instead of replacing it, so a
 * hand-edited config survives `kubb init --plugins ...`.
 *
 * A plugin already in the file is reported as skipped rather than added twice, and a config shape
 * the patcher does not manage (an array config, for one) comes back unchanged with the reason.
 */
export function mergePluginsIntoConfig({ source, selectedPlugins }: { source: string; selectedPlugins: Array<PluginOption> }): {
  source: string
  added: Array<string>
  skipped: Array<{ plugin: string; reason: string }>
  changed: boolean
} {
  const result = applyConfigEdits(
    source,
    selectedPlugins.map((plugin) => ({ op: 'add-plugin', plugin: plugin.packageName, importName: plugin.importName }) as const),
  )

  return {
    source: result.source,
    changed: result.changed,
    added: result.outcomes.filter((outcome) => outcome.applied).map((outcome) => outcome.edit.plugin),
    skipped: result.outcomes.filter((outcome) => !outcome.applied).map((outcome) => ({ plugin: outcome.edit.plugin, reason: outcome.reason ?? 'unknown' })),
  }
}
