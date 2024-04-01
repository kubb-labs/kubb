import { useContext } from 'react'

import { Editor } from '../components/index.ts'

import type { EditorContextProps } from '../components/Editor.tsx'

/**
 * `useEditor` will return the current language set by the parent `Editor` component.
 */
export function useEditor(): EditorContextProps {
  return useContext(Editor.Context)
}
