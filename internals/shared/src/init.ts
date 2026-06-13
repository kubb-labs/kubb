import { pluginDefaultConfigs } from './constants.ts'
import type { PluginOption } from './types.ts'

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

  const pluginConfigs = selectedPlugins
    .map((plugin) => {
      const config = (pluginDefaultConfigs as Record<string, string>)[plugin.value] ?? `${plugin.importName}()`
      return `    ${config},`
    })
    .join('\n')

  return `import { defineConfig } from 'kubb'
${imports}

export default defineConfig({
  root: '.',
  input: {
    path: '${inputPath}',
  },
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
