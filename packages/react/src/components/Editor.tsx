import { createContext, useContext } from 'react'

import type { KubbNode } from '../types.ts'

// eslint-disable-next-line @typescript-eslint/ban-types
export type Language = 'typescript' | 'text' | (string & {})

export type EditorContextProps = {
  language: Language
}

const EditorContext = createContext<EditorContextProps>({ language: 'text' })

type Props = {
  /**
   * Name of the language used.
   * @default 'text'
   */
  language?: EditorContextProps['language']
  children?: KubbNode
}

export function Typescript({ children }: Omit<Props, 'language'>): KubbNode {
  const context = useContext(EditorContext)

  if (context.language !== 'typescript') {
    return null
  }

  return (
    <kubb-editor language="typescript">
      {children}
    </kubb-editor>
  )
}

export function Editor({ language = 'text', children }: Props): KubbNode {
  const context = useContext(EditorContext)

  if (language && context.language !== language) {
    return null
  }

  return (
    <kubb-editor language={language}>
      {children}
    </kubb-editor>
  )
}

Editor.Typescript = Typescript
Editor.Context = EditorContext
Editor.Provider = EditorContext.Provider
Editor.Consumer = EditorContext.Consumer
