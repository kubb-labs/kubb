import { createContext } from '@kubb/react'

import type { SchemaObject } from '@kubb/oas'
import type { Key, KubbNode } from '@kubb/react/types'
import type { Schema as SchemaType } from '../SchemaMapper.ts'

export type SchemaContextProps = {
  name: string
  schemaObject?: SchemaObject
  tree: Array<SchemaType>
}

type Props = {
  key?: Key
  name: string
  schemaObject?: SchemaObject
  tree?: Array<SchemaType>
  children?: KubbNode
}

const SchemaContext = createContext<SchemaContextProps>({
  name: 'unknown',
  tree: [],
})

/**
 * Provides schema-related context to descendant components.
 *
 * Supplies the schema name, optional schema object, and schema tree to its children via React context.
 *
 * @param name - The name of the schema.
 * @param schemaObject - The schema object to provide, if any.
 * @param tree - The schema tree structure, defaults to an empty array.
 */
export function Schema({ name, schemaObject, tree = [], children }: Props) {
  return <SchemaContext.Provider value={{ name, schemaObject, tree }}>{children}</SchemaContext.Provider>
}

Schema.Context = SchemaContext
