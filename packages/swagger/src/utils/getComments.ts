import { Path } from './Path.js'

import type { Operation } from 'oas'

export function getComments(operation: Operation): string[] {
  return [
    operation.getDescription() && `@description ${operation.getDescription()}`,
    operation.getSummary() && `@summary ${operation.getSummary()}`,
    operation.path && `@link ${new Path(operation.path).URL}`,
    operation.isDeprecated() && `@deprecated`,
  ].filter(Boolean) as string[]
}
