import { createContext } from '@kubb/react'

import { OasParser } from './OasParser.tsx'
import { Operation } from './Operation.tsx'
import { Schema } from './Schema.tsx'

import type { KubbNode } from '@kubb/react'
import type { Oas as OasType, Operation as OperationType, SchemaObject } from '../oas/index.ts'
import type { OperationSchemas } from '../types.ts'

export type GetOperationSchemas = (operation: OperationType, statusCode?: string | number) => OperationSchemas

type Props = {
  oas: OasType
  operations?: OperationType[]
  schemas?: SchemaObject[]
  getOperationSchemas?: GetOperationSchemas
  children?: KubbNode
}

type OasContextProps = {
  oas?: OasType
  operations?: OperationType[]
  schemas?: SchemaObject[]
  getOperationSchemas?: GetOperationSchemas
}

const OasContext = createContext<OasContextProps>({})

export function Oas({ oas, children, operations, schemas, getOperationSchemas }: Props): KubbNode {
  return <OasContext.Provider value={{ oas, getOperationSchemas, schemas, operations }}>{children}</OasContext.Provider>
}

Oas.Context = OasContext
Oas.Operation = Operation
Oas.Schema = Schema
Oas.Parser = OasParser
