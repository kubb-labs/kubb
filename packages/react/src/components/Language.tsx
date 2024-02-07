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
  value?: LanguageContextProps
  children?: KubbNode
}

export function Typescript({ children }: Omit<Props, 'language'>): KubbNode {
  const currentLanguage = useContext(LanguageContext)

  if (currentLanguage !== 'typescript') {
    return null
  }

  return (
    <kubb-language value="typescript">
      {children}
    </kubb-language>
  )
}

export function Language({ value = 'text', children }: Props): KubbNode {
  const currentLanguage = useContext(LanguageContext)

  if (value && currentLanguage !== value) {
    return null
  }

  return (
    <kubb-language value={value}>
      {children}
    </kubb-language>
  )
}

Language.Typescript = Typescript
Language.Context = LanguageContext
Language.Provider = LanguageContext.Provider
Language.Consumer = LanguageContext.Consumer
