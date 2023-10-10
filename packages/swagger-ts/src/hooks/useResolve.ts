import { useOperation } from '@kubb/swagger'

import { resolve } from '../utils/resolve.ts'

import type { Resolver } from '@kubb/swagger'

type Props = Omit<Parameters<typeof resolve>[0], 'operation'>

export function useResolve(props: Props): Resolver {
  const operation = useOperation()

  return resolve({ operation, ...props })
}
