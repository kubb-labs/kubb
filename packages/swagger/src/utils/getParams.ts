import { objectToParameters } from '@kubb/core'

import type { OperationSchema } from '../types.ts'

export function getParams(operationSchema: OperationSchema | undefined, { typed }: { typed: boolean } = { typed: false }): string {
  if (!operationSchema || !operationSchema.schema.properties || !operationSchema.name) {
    return ''
  }
  const data = Object.entries(operationSchema.schema.properties).map((item) => {
    return [item[0], operationSchema.name]
  })

  return objectToParameters(data, { typed })
}
