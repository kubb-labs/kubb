import { useContext } from '@kubb/react'

import { Oas } from '../components/Oas.tsx'
import { Operation } from '../components/Operation.tsx'

import type { OperationSchemas } from '../types.ts'

/**
 * When no schemas is set it will call `getSchemas` of `useOas` based on the current operation.
 */
export function useSchemas(): OperationSchemas {
  const { getSchemas } = useContext(Oas.Context)
  const { schemas, operation } = useContext(Operation.Context)

  if (getSchemas && operation) {
    return getSchemas(operation)
  }

  if (!schemas) {
    throw new Error(`Schemas is not defined for operations ${operation?.path || 'unknown operation'}`)
  }

  return schemas
}
