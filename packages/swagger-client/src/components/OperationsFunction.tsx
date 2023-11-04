import type { HttpMethod } from '@kubb/swagger'
import type { ReactNode } from 'react'

type Props = {
  name?: string
  children?: ReactNode
  operations: Record<string, { path: string; method: HttpMethod }>
}

export function OperationsFunction({
  name = 'operations',
  operations,
  children,
}: Props): ReactNode {
  return (
    <>
      {`export const ${name} = ${JSON.stringify(operations)} as const;`}
      {children}
    </>
  )
}
