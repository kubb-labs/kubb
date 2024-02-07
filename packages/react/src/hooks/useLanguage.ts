import { useContext } from 'react'

import { Language } from '../components/Language.tsx'

import type { LanguageContextProps } from '../components/Language.tsx'

export function useLanguage(): LanguageContextProps | null {
  return useContext(Language.Context)
}
