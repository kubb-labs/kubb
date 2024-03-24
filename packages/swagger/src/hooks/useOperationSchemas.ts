import { useContext } from '@kubb/react'

import { Oas } from '../components/Oas.tsx'
import { Operation } from '../components/Operation.tsx'

import type { OperationSchemas } from '../types.ts'

/**
 * When no schemas is set it will call `getOperationSchemas` of `useOas` based on the current operation.
 */
export function useOperationSchemas(): OperationSchemas {
  const { getOperationSchemas: getSchemas } = useContext(Oas.Context)
  const { schemas, operation } = useContext(Operation.Context)

  if (getSchemas && operation) {
    return getSchemas(operation)
  }

  if (!schemas) {
    throw new Error(`Schemas is not defined for operations ${operation?.path || 'unknown operation'}`)
  }

  return schemas
}
