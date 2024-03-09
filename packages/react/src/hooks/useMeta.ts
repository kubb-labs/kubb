import { useApp } from './useApp.ts'

import type { AppContextProps } from '../components/App.tsx'

export function useMeta<Meta extends Record<string, unknown> = Record<string, unknown>>(): AppContextProps<Meta>['meta'] {
  const app = useApp<Meta>()

  return app.meta
}
