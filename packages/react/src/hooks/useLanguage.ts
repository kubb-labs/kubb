import { useContext } from 'react'

import { Editor } from '../components/index.ts'

import type { EditorContextProps } from '../components/Editor.tsx'

export function useLanguage(): EditorContextProps {
  return useContext(Editor.Context)
}
