import { createContext, useContext } from 'react'

import type { KubbNode } from '../types.ts'

export type ParserLanguage = 'typescript' | 'text' | (string & {})

export type ParserContextProps = {
  language: ParserLanguage
}

const ParserContext = createContext<ParserContextProps>({ language: 'text' })

type Props = {
  /**
   * Name of the language used.
   * @default 'text'
   */
  language?: ParserContextProps['language']
  children?: KubbNode
}

export function TypeScript({ children }: Omit<Props, 'language'>): KubbNode {
  const context = useContext(ParserContext)

  if (context.language !== 'typescript') {
    return null
  }

  return children
}

export function Parser({ language = 'text', children }: Props): KubbNode {
  return (
    <kubb-parser language={language}>
      <ParserContext.Provider value={{ language }}>{children}</ParserContext.Provider>
    </kubb-parser>
  )
}

Parser.TypeScript = TypeScript
Parser.Context = ParserContext
