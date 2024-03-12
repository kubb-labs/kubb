import { useApp } from './useApp.ts'

import type { AppContextProps } from '../components/App.tsx'

/**
 * `useMeta` will return an object containing the meta that has been provided with the `root.render` functionality.
 */
export function useMeta<Meta extends Record<string, unknown> = Record<string, unknown>>(): AppContextProps<Meta>['meta'] {
  const app = useApp<Meta>()

  return app.meta
}
