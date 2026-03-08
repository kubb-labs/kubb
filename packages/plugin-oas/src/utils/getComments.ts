import type { Operation } from '@kubb/oas'
import { URLPath } from '@kubb/utils'

export function getComments(operation: Operation): string[] {
  return [
    operation.getDescription() && `@description ${operation.getDescription()}`,
    operation.getSummary() && `@summary ${operation.getSummary()}`,
    operation.path && `{@link ${new URLPath(operation.path).URL}}`,
    operation.isDeprecated() && '@deprecated',
  ]
    .filter((x): x is string => Boolean(x))
    .flatMap((text) => {
      return text.split(/\r?\n/).map((line) => line.trim())
    })
    .filter((x): x is string => Boolean(x))
}
