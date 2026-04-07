import type { Oas } from '@kubb/oas'
import { inject, OasContext } from '@kubb/renderer-jsx'

/**
 * @deprecated use schemaNode or operationNode instead
 */
export function useOas(): Oas {
  return inject(OasContext) as Oas
}
