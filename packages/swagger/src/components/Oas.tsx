import { createContext } from '@kubb/react'

import { Operation } from './Operation.tsx'
import { Schema } from './Schema.tsx'

import type { Oas as OasType, Operation as OperationType } from '@kubb/oas'
import type { KubbNode } from '@kubb/react'
import type { OperationSchemas } from '../types.ts'

export type GetOperationSchemas = (operation: OperationType, statusCode?: string | number) => OperationSchemas

type Props = {
  oas: OasType
  operations?: OperationType[]
  getOperationSchemas?: GetOperationSchemas
  children?: KubbNode
}

type OasContextProps = {
  oas?: OasType
  operations?: OperationType[]
  getOperationSchemas?: GetOperationSchemas
}

const OasContext = createContext<OasContextProps>({})

export function Oas({ oas, children, operations, getOperationSchemas }: Props): KubbNode {
  return <OasContext.Provider value={{ oas, getOperationSchemas, operations }}>{children}</OasContext.Provider>
}

Oas.Context = OasContext
Oas.Operation = Operation
Oas.Schema = Schema
