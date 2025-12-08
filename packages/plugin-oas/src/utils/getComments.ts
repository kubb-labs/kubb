import transformers from '@kubb/core/transformers'
import { URLPath } from '@kubb/core/utils'

import type { Operation } from '@kubb/oas'

export function getComments(operation: Operation): string[] {
  const getDescriptionSafe = () => {
    try {
      return operation.getDescription()
    } catch {
      return undefined
    }
  }

  const getSummarySafe = () => {
    try {
      return operation.getSummary()
    } catch {
      return undefined
    }
  }

  const isDeprecatedSafe = () => {
    try {
      return operation.isDeprecated()
    } catch {
      return false
    }
  }

  const description = getDescriptionSafe()
  const summary = getSummarySafe()
  const deprecated = isDeprecatedSafe()

  return [
    description && `@description ${description}`,
    summary && `@summary ${summary}`,
    operation.path && `{@link ${new URLPath(operation.path).URL}}`,
    deprecated && '@deprecated',
  ]
    .filter(Boolean)
    .map((text) => transformers.trim(text))
    .filter(Boolean)
}
