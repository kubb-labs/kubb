import { useContext } from '@kubb/react'

import { Oas } from '../components/Oas.tsx'

import type { Oas as OasType } from '@kubb/oas'

export function useOas(): OasType {
  const { oas } = useContext(Oas.Context)

  if (!oas) {
    throw new Error('Oas is not defined')
  }

  return oas
}
