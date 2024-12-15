import { createContext } from '@kubb/react'

import type { SchemaObject } from '@kubb/oas'
import type { Key, KubbNode } from '@kubb/react/types'
import type { Schema as SchemaType } from '../SchemaMapper.ts'

export type SchemaContextProps = {
  name: string
  schema?: SchemaObject
  tree: Array<SchemaType>
}

type Props = {
  key?: Key
  name: string
  value?: SchemaObject
  tree?: Array<SchemaType>
  children?: KubbNode
}

const SchemaContext = createContext<SchemaContextProps>({
  name: 'unknown',
  tree: [],
})

export function Schema({ name, value, tree = [], children }: Props) {
  return <SchemaContext.Provider value={{ name, schema: value, tree }}>{children}</SchemaContext.Provider>
}

Schema.Context = SchemaContext
