import type { PluginOption } from './types.ts'

export const KUBB_CONFIG_FILENAME = 'kubb.config.ts' as const

export const initDefaults = {
  inputPath: './openapi.yaml',
  outputPath: './src/gen',
  plugins: ['plugin-ts'],
} as const

export const availablePlugins: Array<PluginOption> = [
  {
    value: 'plugin-ts',
    label: 'TypeScript',
    hint: 'Recommended',
    packageName: '@kubb/plugin-ts',
    importName: 'pluginTs',
    category: 'types',
  },
  {
    value: 'plugin-client',
    label: 'Client (Fetch/Axios)',
    packageName: '@kubb/plugin-client',
    importName: 'pluginClient',
    category: 'client',
  },
  {
    value: 'plugin-react-query',
    label: 'React Query / TanStack Query',
    packageName: '@kubb/plugin-react-query',
    importName: 'pluginReactQuery',
    category: 'framework',
  },
  {
    value: 'plugin-vue-query',
    label: 'Vue Query',
    packageName: '@kubb/plugin-vue-query',
    importName: 'pluginVueQuery',
    category: 'framework',
  },
  {
    value: 'plugin-zod',
    label: 'Zod Schemas',
    packageName: '@kubb/plugin-zod',
    importName: 'pluginZod',
    category: 'validation',
  },
  {
    value: 'plugin-faker',
    label: 'Faker.js Mocks',
    packageName: '@kubb/plugin-faker',
    importName: 'pluginFaker',
    category: 'mocks',
  },
  {
    value: 'plugin-msw',
    label: 'MSW Handlers',
    packageName: '@kubb/plugin-msw',
    importName: 'pluginMsw',
    category: 'mocks',
  },
  {
    value: 'plugin-cypress',
    label: 'Cypress Tests',
    packageName: '@kubb/plugin-cypress',
    importName: 'pluginCypress',
    category: 'testing',
  },
  {
    value: 'plugin-mcp',
    label: 'MCP Server (AI / Model Context Protocol)',
    packageName: '@kubb/plugin-mcp',
    importName: 'pluginMcp',
    category: 'ai',
  },
  {
    value: 'plugin-redoc',
    label: 'ReDoc Documentation',
    packageName: '@kubb/plugin-redoc',
    importName: 'pluginRedoc',
    category: 'documentation',
  },
]

export const pluginDefaultConfigs = {
  'plugin-ts': `pluginTs()`,
  'plugin-client': `pluginClient()`,
  'plugin-react-query': `pluginReactQuery()`,
  'plugin-vue-query': `pluginVueQuery()`,
  'plugin-zod': `pluginZod()`,
  'plugin-faker': `pluginFaker()`,
  'plugin-msw': `pluginMsw()`,
  'plugin-cypress': `pluginCypress()`,
  'plugin-mcp': `pluginMcp()`,
  'plugin-redoc': `pluginRedoc()`,
} as const satisfies Record<string, string>
