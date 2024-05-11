import { useContext } from '@kubb/react'

import { Schema } from '../components/Schema.tsx'

import type { SchemaContextProps } from '../components/Schema.tsx'

type UseSchemaResult = SchemaContextProps

/**
 * `useSchema` will return the current `schema properties`
 */
export function useSchema(): UseSchemaResult {
  const props = useContext(Schema.Context)

  return props as UseSchemaResult
}
