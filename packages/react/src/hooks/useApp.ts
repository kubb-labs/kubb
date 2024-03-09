import { useContext } from 'react'

import { App } from '../components/App.tsx'

import type { AppContextProps } from '../components/App.tsx'

export function useApp<Meta extends Record<string, unknown> = Record<string, unknown>>(): AppContextProps<Meta> {
  return useContext(App.Context) as AppContextProps<Meta>
}
