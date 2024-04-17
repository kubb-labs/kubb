import { useContext } from '@kubb/react'

import { Schema } from '../components/Schema.tsx'

import type { SchemaGenerator } from '../SchemaGenerator.ts'
import type { SchemaContextProps } from '../components/Schema.tsx'

type UseSchemaResult = Omit<SchemaContextProps, 'generator'> & {
  generator: SchemaGenerator
}

/**
 * `useSchema` will return the current `schema properties`
 */
export function useSchema(): UseSchemaResult {
  const props = useContext(Schema.Context)

  if (!props.generator) {
    throw new Error('Generator is not defined')
  }

  return props as UseSchemaResult
}
