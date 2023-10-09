import { useContext } from 'react'

import { AppContext } from '../components/AppContext.tsx'

import type { AppContextProps } from '../components/AppContext.tsx'

export function useMeta<Meta extends Record<string, unknown> = Record<string, unknown>>(): AppContextProps<Meta>['meta'] {
  const context = useContext(AppContext) as AppContextProps<Meta>
  return context.meta
}
