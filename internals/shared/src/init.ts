import { availablePlugins } from './constants.ts'
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
 * Appends the dist-tag matching the running CLI version to each package name,
 * so a beta CLI scaffolds beta packages instead of the older stable majors.
 */
export function withDistTag({ packages, version }: { packages: Array<string>; version: string }): Array<string> {
  const prerelease = version.match(/-([a-z]+)/)?.[1]
  const tag = prerelease ?? 'latest'
  return packages.map((name) => `${name}@${tag}`)
}
