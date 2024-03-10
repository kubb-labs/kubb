import { useContext } from '@kubb/react'

import { Oas } from '../components/Oas.tsx'

import type { GetSchemas } from '../components/Oas.tsx'
import type { Oas as OasType } from '../oas/index.ts'

type Result = {
  oas: OasType
  /**
   * @deprecated replace 'getSchemas' with `useOperationHelpers`
   */
  getSchemas: GetSchemas
}

export function useOas(): Result {
  const { oas, getSchemas } = useContext(Oas.Context)

  if (!oas || !getSchemas) {
    throw new Error('Oas is not defined')
  }

  return { oas, getSchemas }
}
