import { createContext } from '@kubb/react'

import type { Operation as OperationType } from '@kubb/oas'
import type { KubbNode } from '@kubb/react'

type Props = {
  operation: OperationType
  children?: KubbNode
}

type OperationContextProps = {
  operation?: OperationType
}

const OperationContext = createContext<OperationContextProps>({})

export function Operation({ operation, children }: Props): KubbNode {
  return <OperationContext.Provider value={{ operation }}>{children}</OperationContext.Provider>
}

Operation.Context = OperationContext
