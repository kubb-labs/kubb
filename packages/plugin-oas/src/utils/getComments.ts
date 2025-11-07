import transformers from '@kubb/core/transformers'
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
    .map((text) => transformers.trim(text))
    .filter(Boolean)
}
