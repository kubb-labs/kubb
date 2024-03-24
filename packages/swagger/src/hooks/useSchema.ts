import { useContext } from '@kubb/react'

import { Schema } from '../components/Schema.tsx'

import type { SchemaObject } from '../oas/index.ts'

/**
 * `useSchemaObject` will return the current `SchemaObject`
 */
export function useSchemaObject(): SchemaObject | undefined {
  const { object } = useContext(Schema.Context)

  return object
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
