import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import { initSchema } from '../schemas/initSchema.ts'

type PluginOption = {
  value: string
  label: string
  packageName: string
  importName: string
}

const availablePlugins: PluginOption[] = [
  { value: 'plugin-ts', label: 'TypeScript', packageName: '@kubb/plugin-ts', importName: 'pluginTs' },
  { value: 'plugin-client', label: 'Client (Fetch/Axios)', packageName: '@kubb/plugin-client', importName: 'pluginClient' },
  { value: 'plugin-react-query', label: 'React Query / TanStack Query', packageName: '@kubb/plugin-react-query', importName: 'pluginReactQuery' },
  { value: 'plugin-vue-query', label: 'Vue Query', packageName: '@kubb/plugin-vue-query', importName: 'pluginVueQuery' },
  { value: 'plugin-zod', label: 'Zod Schemas', packageName: '@kubb/plugin-zod', importName: 'pluginZod' },
  { value: 'plugin-faker', label: 'Faker.js Mocks', packageName: '@kubb/plugin-faker', importName: 'pluginFaker' },
  { value: 'plugin-msw', label: 'MSW Handlers', packageName: '@kubb/plugin-msw', importName: 'pluginMsw' },
  { value: 'plugin-cypress', label: 'Cypress Tests', packageName: '@kubb/plugin-cypress', importName: 'pluginCypress' },
  { value: 'plugin-mcp', label: 'MCP Server (AI)', packageName: '@kubb/plugin-mcp', importName: 'pluginMcp' },
  { value: 'plugin-redoc', label: 'ReDoc Documentation', packageName: '@kubb/plugin-redoc', importName: 'pluginRedoc' },
]

const pluginDefaultConfigs: Record<string, string> = {
  'plugin-ts': `pluginTs({ output: { path: 'models' } })`,
  'plugin-client': `pluginClient({ output: { path: 'clients' } })`,
  'plugin-react-query': `pluginReactQuery({ output: { path: 'hooks' } })`,
  'plugin-vue-query': `pluginVueQuery({ output: { path: 'hooks' } })`,
  'plugin-zod': `pluginZod({ output: { path: 'zod' } })`,
  'plugin-faker': `pluginFaker({ output: { path: 'mocks' } })`,
  'plugin-msw': `pluginMsw({ output: { path: 'msw' } })`,
  'plugin-cypress': `pluginCypress({ output: { path: 'cypress' } })`,
  'plugin-mcp': `pluginMcp({ output: { path: 'mcp' } })`,
  'plugin-redoc': `pluginRedoc({ output: { path: 'redoc' } })`,
}

function generateConfigFile(selectedPlugins: PluginOption[], inputPath: string, outputPath: string): string {
  const imports = selectedPlugins.map((plugin) => `import { ${plugin.importName} } from '${plugin.packageName}'`).join('\n')

  const pluginConfigs = selectedPlugins
    .map((plugin) => {
      const config = pluginDefaultConfigs[plugin.value] ?? `${plugin.importName}()`
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

function resolvePlugins(pluginsFlag: string | undefined): PluginOption[] {
  if (!pluginsFlag) {
    return availablePlugins.filter((p) => p.value === 'plugin-ts')
  }
  const requested = pluginsFlag
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  const matched = availablePlugins.filter((p) => requested.includes(p.value))
  return matched.length > 0 ? matched : availablePlugins.filter((p) => p.value === 'plugin-ts')
}

export const initTool = defineTool(
  {
    name: 'init',
    description: 'Scaffold a kubb.config.ts in the current directory (non-interactive). Does not install packages.',
    schema: initSchema,
  },
  async ({ input = './openapi.yaml', output = './src/gen', plugins }) => {
    const selected = resolvePlugins(plugins)
    const content = generateConfigFile(selected, input, output)
    const dest = path.join(process.cwd(), 'kubb.config.ts')
    fs.writeFileSync(dest, content, 'utf-8')
    const packageList = ['kubb', ...selected.map((p) => p.packageName)].join(' ')
    return tool.text(
      `Created kubb.config.ts\n\nInstall packages:\n  npm install ${packageList}\n\nThen run:\n  npx kubb generate`,
    )
  },
)
