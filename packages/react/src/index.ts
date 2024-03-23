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
export { createNode } from './shared/dom.ts'
export type * from './types.ts'
export { createContext, useContext } from 'react'
