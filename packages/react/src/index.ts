import React from 'react'

export type { RootType } from './client/index.ts'
export { createRoot } from './client/index.ts'
export type { AppContextProps } from './components/index.ts'
export type { EditorLanguage } from './components/index.ts'
export { Editor, File, Function, Text, Type } from './components/index.ts'
export {
  useApp,
  useFile,
  useFileManager,
  useIndent,
  useLanguage,
  useMeta,
  usePackageVersion,
  usePlugin,
  usePluginManager,
  useResolveName,
  useResolvePath,
} from './hooks/index.ts'
export type * from './types.ts'

export default React
