import { objectToParameters } from '@kubb/core'

import type { OperationSchema } from '../types'

export function getParams(
  operationSchema: OperationSchema | undefined,
  { typed, nameResolver }: { typed: boolean; nameResolver?: (name: string) => string | null } = { typed: false }
): string {
  if (!operationSchema || !operationSchema.schema.properties || !operationSchema.name) {
    return ''
  }
  const data = Object.entries(operationSchema.schema.properties).map((item) => {
    return [item[0], nameResolver?.(operationSchema.name) || operationSchema.name]
  })

  return objectToParameters(data, { typed })
}
