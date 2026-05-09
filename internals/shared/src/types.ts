export type PluginOption = {
  value: string
  label: string
  hint?: string
  packageName: string
  importName: string
  category: 'types' | 'client' | 'framework' | 'validation' | 'testing' | 'mocks' | 'documentation' | 'ai'
}
