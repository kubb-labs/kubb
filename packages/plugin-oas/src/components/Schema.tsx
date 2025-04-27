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
 * Wraps its children with a context containing the schema name, optional schema object, and an optional schema type tree.
 *
 * @param name - The name of the schema.
 * @param schemaObject - The schema object to provide in context, if available.
 * @param tree - An array representing the schema type hierarchy.
 */
export function Schema({ name, schemaObject, tree = [], children }: Props) {
  return <SchemaContext.Provider value={{ name, schemaObject, tree }}>{children}</SchemaContext.Provider>
}

Schema.Context = SchemaContext
