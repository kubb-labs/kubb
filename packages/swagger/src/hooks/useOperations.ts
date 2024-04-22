import { useContext } from '@kubb/react'

import { Oas } from '../components/Oas.tsx'

import type { HttpMethod, Operation } from '@kubb/oas'

type UseOperationsProps = {
  /**
   * Filter based on path
   * Weight: 2
   */
  path?: string
  /**
   * Filter based on method
   * Weight: 1
   */
  method?: HttpMethod
}

/**
 * `useOperations` will return all the Operations
 */
export function useOperations({ method, path }: UseOperationsProps = {}): Operation[] {
  const { operations } = useContext(Oas.Context)

  if (!operations) {
    throw new Error('Operations is not defined')
  }
  let items = operations

  if (path) {
    items = items.filter((item) => item.path === path)
  }

  if (method) {
    items = items.filter((item) => item.method === method)
  }

  return items
}
