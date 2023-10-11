import { useOperation } from '@kubb/swagger'

import { resolve } from '../utils/resolve.ts'

import type { ResolveProps, Resolver } from '@kubb/swagger'

type Props = Omit<ResolveProps, 'operation'>

export function useResolve(props: Props): Resolver {
  const operation = useOperation()

  return resolve({ operation, ...props })
}
