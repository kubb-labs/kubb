import { createContext } from '@kubb/react'

import type { KubbNode } from '@kubb/react'
import type { Operation as OperationType, SchemaObject } from '../oas/index.ts'

type Props = {
  name?: string
  object?: SchemaObject
  children?: KubbNode
}

type SchemaContextProps = {
  name?: string
  object?: SchemaObject
  operation?: OperationType
}

const SchemaContext = createContext<SchemaContextProps>({})

export function Schema({ name, object, children }: Props): KubbNode {
  return <SchemaContext.Provider value={{ name, object }}>{children}</SchemaContext.Provider>
}

Schema.Context = SchemaContext
