import { useContext } from '@kubb/react'

import { Schema } from '../components/Schema.tsx'

import type { SchemaObject } from '../oas/index.ts'

/**
 * `useSchema` will return the current `Schema`
 */
export function useSchema(): SchemaObject {
  const { schema } = useContext(Schema.Context)

  if (!schema) {
    throw new Error('schema is not defined')
  }

  return schema
}

/**
 * `useSchemaName` will return the name based on the current schema.
 */
export function useSchemaName(): string {
  const { name } = useContext(Schema.Context)

  if (!name) {
    throw new Error('name for schema is not defined')
  }

  return name
}
