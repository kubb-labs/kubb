import { createContext, useContext } from 'react'

import type { KubbNode } from '../types.ts'

// eslint-disable-next-line @typescript-eslint/ban-types
export type LanguageContextProps = 'typescript' | 'text' | (string & {})

const LanguageContext = createContext<LanguageContextProps | null>('text')

type Props = {
  /**
   * Name of the language used.
   * @default 'text'
   */
  language?: LanguageContextProps
  children?: KubbNode
}

export function Typescript({ children }: Omit<Props, 'language'>): KubbNode {
  const currentLanguage = useContext(LanguageContext)

  if (currentLanguage !== 'typescript') {
    return null
  }

  return (
    <kubb-language language="typescript">
      {children}
    </kubb-language>
  )
}

export function Language({ language = 'text', children }: Props): KubbNode {
  const currentLanguage = useContext(LanguageContext)

  if (language && currentLanguage !== language) {
    return null
  }

  return (
    <kubb-language language={language}>
      {children}
    </kubb-language>
  )
}

Language.Typescript = Typescript
Language.Context = LanguageContext
Language.Provider = LanguageContext.Provider
Language.Consumer = LanguageContext.Consumer
