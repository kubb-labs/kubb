import { useContext } from 'react'

import { Root } from '../components/Root.tsx'

/**
 * `useLifecycle` will return some helpers to exit/restart the generation.
 */
export function useLifecycle() {
  const { exit } = useContext(Root.Context)

  return {
    exit,
  }
}
