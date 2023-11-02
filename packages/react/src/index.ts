import { transformers } from '@kubb/core/utils'

export type { RootType } from './client/index.ts'
export { createRoot } from './client/index.ts'
export type { AppContextProps } from './components/index.ts'
export { Export, File, Function, Import, Text } from './components/index.ts'
export { useApp, useFileManager, useIndent, useMeta, usePackageVersion, usePluginManager } from './hooks/index.ts'
export * from './types.ts'
/**
 * @deprecated use `@kubb/core/utils' import instead
 */
export const createIndent = transformers.createIndent
