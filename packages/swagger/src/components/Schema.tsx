import { createContext } from '@kubb/react'

import type { KubbNode } from '@kubb/react'
import type { Operation as OperationType, SchemaObject } from '../oas/index.ts'

type Props = {
  name?: string
  schema?: SchemaObject
  children?: KubbNode
}

type SchemaContextProps = {
  name?: string
  schema?: SchemaObject
  operation?: OperationType
}

const SchemaContext = createContext<SchemaContextProps>({})

export function Schema({ name, schema, children }: Props): KubbNode {
  return <SchemaContext.Provider value={{ name, schema }}>{children}</SchemaContext.Provider>
}

Schema.Context = SchemaContext
