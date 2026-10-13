import { availablePlugins, type PluginOption } from './constants.ts'

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
  const imports = [
    `import { defineConfig } from 'kubb/config'`,
    ...selectedPlugins.map((plugin) => `import { ${plugin.importName} } from '${plugin.packageName}'`),
  ].join('\n')

  const pluginConfigs = selectedPlugins.map((plugin) => `    ${plugin.importName}(),`).join('\n')

  return `${imports}

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
