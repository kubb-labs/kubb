import transformers from '@kubb/core/transformers'

export type { RootType } from './client/index.ts'
export { createRoot } from './client/index.ts'
export type { AppContextProps } from './components/index.ts'
export { File, Function, Text, Type } from './components/index.ts'
export {
  useApp,
  useFile,
  useFileManager,
  useIndent,
  useMeta,
  usePackageVersion,
  usePlugin,
  usePluginManager,
  useResolveName,
  useResolvePath,
} from './hooks/index.ts'
export * from './types.ts'
/**
 * @deprecated use `@kubb/core/utils' import instead
 */
export const createIndent = transformers.createIndent
