import { URLPath } from '@kubb/core/utils'

import type { Operation } from '@kubb/oas'

export function getComments(operation: Operation): string[] {
  return [
    operation.getDescription() && `@description ${operation.getDescription()}`,
    operation.getSummary() && `@summary ${operation.getSummary()}`,
    operation.path && `{@link ${new URLPath(operation.path).URL}}`,
    operation.isDeprecated() && '@deprecated',
  ]
    .filter(Boolean)
    .flatMap((text) => {
      // Split by newlines to preserve line breaks in JSDoc
      // Trim each line individually to remove leading/trailing whitespace
      return text.split(/\r?\n/).map((line) => line.trim())
    })
    .filter(Boolean)
}
