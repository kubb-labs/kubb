import { useContext } from '@kubb/react'

import { Schema } from '../components/Schema.tsx'

import type { SchemaContextProps } from '../components/Schema.tsx'

/**
 * `useSchema` will return the current `schema properties`
 */
export function useSchema(): SchemaContextProps {
  return useContext(Schema.Context)
}
