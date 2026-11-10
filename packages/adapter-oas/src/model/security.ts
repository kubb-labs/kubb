import { unescapePointerToken } from '@internals/utils'
import type { Document } from '../types.ts'

const SCHEME_POINTER = '#/components/securitySchemes/'

/**
 * Maps security requirements to scheme names. From 3.2 a key may be a URI to the scheme, such as
 * `#/components/securitySchemes/oauth`, which becomes `oauth`. Returns `undefined` for a missing or malformed list.
 */
export function toSecurityRequirements(requirements: unknown, document: Document): Array<Record<string, Array<string>>> | undefined {
  if (!Array.isArray(requirements)) return undefined
  const schemes = document.components?.securitySchemes ?? {}
  const toName = (key: string) => {
    const index = key.indexOf(SCHEME_POINTER)
    return Object.hasOwn(schemes, key) || index === -1 ? key : unescapePointerToken(key.slice(index + SCHEME_POINTER.length))
  }

  return requirements
    .filter((requirement): requirement is Record<string, unknown> => !!requirement && typeof requirement === 'object')
    .map((requirement) =>
      Object.fromEntries(Object.entries(requirement).map(([key, scopes]) => [toName(key), Array.isArray(scopes) ? scopes.map(String) : []])),
    )
}
