import { URLPath } from '@kubb/core'

import type { Operation } from 'oas'

export function getComments(operation: Operation): string[] {
  return [
    operation.getDescription() && `@description ${operation.getDescription()}`,
    operation.getSummary() && `@summary ${operation.getSummary()}`,
    operation.path && `@link ${new URLPath(operation.path).URL}`,
    operation.isDeprecated() && `@deprecated`,
  ].filter(Boolean)
}
