import { useContext } from 'react'

import { Editor } from '../components/index.ts'

import type { EditorContextProps } from '../components/Editor.tsx'

/**
 * `useLanguage` will return the current language set by the parent `Editor` component.
 */
export function useLanguage(): EditorContextProps {
  return useContext(Editor.Context)
}
