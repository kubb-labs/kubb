export type { RootType } from './client/index.ts'
export { createRoot } from './client/index.ts'
export type { EditorLanguage } from './components/index.ts'
export { Editor, File, App, Function, Text, Type } from './components/index.ts'
export {
  useApp,
  useFile,
  useEditor,
  useIndent,
} from './hooks/index.ts'
export { createNode } from './shared/dom.ts'
export type * from './types.ts'
export { createContext, useContext } from 'react'
