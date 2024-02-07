import { useContext } from 'react'

import { AppContext } from '../components/AppContext.ts'

import type { AppContextProps } from '../components/AppContext.ts'

export function useApp<Meta extends Record<string, unknown> = Record<string, unknown>>(): AppContextProps<Meta> {
  return useContext(AppContext) as AppContextProps<Meta>
}
