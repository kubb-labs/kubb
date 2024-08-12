import { createContext } from '@kubb/react'

import { Operation } from './Operation.tsx'
import { Schema } from './Schema.tsx'

import type { Oas as OasType, Operation as OperationType } from '@kubb/oas'
import type { KubbNode } from '@kubb/react'
import type { OperationGenerator } from '../OperationGenerator.ts'
import type { OperationsByMethod } from '@kubb/plugin-oas'

type Props = {
  oas: OasType
  operations?: OperationType[]
  operationsByMethod?: OperationsByMethod
  generator?: OperationGenerator
  children?: KubbNode
}

type OasContextProps = {
  oas?: OasType
  operations?: OperationType[]
  operationsByMethod?: OperationsByMethod
  generator?: OperationGenerator
}

const OasContext = createContext<OasContextProps>({})

export function Oas({ oas, children, operations, generator, operationsByMethod }: Props): KubbNode {
  return <OasContext.Provider value={{ oas, generator, operations, operationsByMethod }}>{children}</OasContext.Provider>
}

Oas.Context = OasContext
Oas.Operation = Operation
Oas.Schema = Schema
