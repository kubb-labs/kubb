import { useContext } from '@kubb/react'

import { Operation } from '../components/Operation.tsx'

import type { OperationSchemas } from '../types.ts'

export function useSchemas(): OperationSchemas {
  const { schemas } = useContext(Operation.Context)

  if (!schemas) {
    throw new Error('Schemas is not defined')
  }

  return schemas
}
