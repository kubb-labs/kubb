import { useContext } from 'react'

import { AppContext } from '../components/AppContext.tsx'

import type { AppContextProps } from '../components/AppContext.tsx'

export function useApp<Meta extends Record<string, unknown> = Record<string, unknown>>(): AppContextProps<Meta> {
  return useContext(AppContext) as AppContextProps<Meta>
}
