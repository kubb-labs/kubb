import { createContext } from '@kubb/react'

import { Operation } from './Operation.tsx'

import type { KubbNode } from '@kubb/react'
import type { Oas as OasType, Operation as OperationType } from '../oas/index.ts'
import type { OperationSchemas } from '../types.ts'

type Props = {
  oas: OasType
  operations: OperationType[]
  getSchemas: (operation: OperationType, statusCode?: string | number) => OperationSchemas
  children?: KubbNode
}

type OasContextProps = {
  oas?: OasType
  operations?: OperationType[]
  getSchemas?: (operation: OperationType, statusCode?: string | number) => OperationSchemas
}

const OasContext = createContext<OasContextProps>({})

export function Oas({ oas, children, operations, getSchemas }: Props): KubbNode {
  return <OasContext.Provider value={{ oas, getSchemas, operations }}>{children}</OasContext.Provider>
}

Oas.Context = OasContext
Oas.Operation = Operation
