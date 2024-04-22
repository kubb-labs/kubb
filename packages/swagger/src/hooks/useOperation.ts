import { useContext } from '@kubb/react'

import { Operation } from '../components/Operation.tsx'

import type { Operation as OperationType } from '@kubb/oas'

/**
 * `useOperation` will return the current `Operation`
 */
export function useOperation(): OperationType {
  const { operation } = useContext(Operation.Context)

  if (!operation) {
    throw new Error('Operation is not defined')
  }

  return operation
}
