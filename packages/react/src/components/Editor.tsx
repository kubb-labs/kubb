import { createContext, useContext } from 'react'

import type { KubbNode } from '../types.ts'

// eslint-disable-next-line @typescript-eslint/ban-types
export type EditorLanguage = 'typescript' | 'text' | (string & {})

export type EditorContextProps = {
  language: EditorLanguage
}

const EditorContext = createContext<EditorContextProps>({ language: 'text' })

type Props = {
  key?: React.Key
  /**
   * Name of the language used.
   * @default 'text'
   */
  language?: EditorContextProps['language']
  children?: KubbNode
}

export function TypeScript({ children }: Omit<Props, 'language'>): KubbNode {
  const context = useContext(EditorContext)

  if (context.language !== 'typescript') {
    return null
  }

  return children
}

export function Editor({ key, language = 'text', children }: Props): KubbNode {
  return (
    <kubb-editor key={key} language={language}>
      <EditorContext.Provider value={{ language }}>
        {children}
      </EditorContext.Provider>
    </kubb-editor>
  )
}

Editor.TypeScript = TypeScript
Editor.Context = EditorContext
