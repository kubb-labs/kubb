import { createContext } from '@kubb/react'

import type { KubbNode } from '@kubb/react'
import type { Operation as OperationType } from '../oas/index.ts'
import type { OperationSchemas } from '../types.ts'

type Props = {
  schemas: OperationSchemas
  operation: OperationType
  children?: KubbNode
}

type OperationContextProps = {
  schemas?: OperationSchemas
  operation?: OperationType
}

const OperationContext = createContext<OperationContextProps>({})

export function Operation({ schemas, operation, children }: Props): KubbNode {
  return <OperationContext.Provider value={{ schemas, operation }}>{children}</OperationContext.Provider>
}

Operation.Context = OperationContext
