import { unescapePointerToken } from '@internals/utils'
import type { ast } from '@kubb/kit'
import { pickStrings } from '../oas.ts'
import type { Refs } from '../refs.ts'
import type { Document, SecuritySchemeObject } from '../types.ts'

const SCHEME_POINTER = '#/components/securitySchemes/'
const API_KEY_LOCATIONS = new Set(['header', 'query', 'cookie'])

/** How a client sends the scheme's credential, or `undefined` when it cannot place one. */
function getCredential(scheme: SecuritySchemeObject): ast.AuthCredential | undefined {
  if (scheme.type === 'apiKey') {
    return scheme.name && scheme.in && API_KEY_LOCATIONS.has(scheme.in) ? { type: 'apiKey', in: scheme.in as 'header', name: scheme.name } : undefined
  }
  if (scheme.type === 'http') {
    const name = scheme.scheme?.toLowerCase()
    if (name === 'bearer') return { type: 'bearer', ...(scheme.bearerFormat && { format: scheme.bearerFormat }) }
    if (name === 'basic') return { type: 'basic' }
    return scheme.scheme ? { type: 'http', scheme: scheme.scheme } : undefined
  }
  if (scheme.type === 'oauth2' || scheme.type === 'openIdConnect') return { type: 'bearer' }
  return scheme.type === 'mutualTLS' ? { type: 'mutualTLS' } : undefined
}

/** Where a client gets the token from, for an `oauth2` or `openIdConnect` scheme. */
function getTokenSource(scheme: SecuritySchemeObject): ast.AuthTokenSource | undefined {
  if (scheme.type === 'openIdConnect') return scheme.openIdConnectUrl ? { type: 'openIdConnect', url: scheme.openIdConnectUrl } : undefined
  if (scheme.type !== 'oauth2') return undefined
  const flows = Object.entries(scheme.flows ?? {}).map(([name, flow]) => {
    const scopes = flow && typeof flow === 'object' && flow.scopes && typeof flow.scopes === 'object' ? { scopes: flow.scopes as Record<string, string> } : {}
    return [name, { ...pickStrings(flow, ['authorizationUrl', 'deviceAuthorizationUrl', 'tokenUrl', 'refreshUrl']), ...scopes }] as const
  })
  return { type: 'oauth2', flows: Object.fromEntries(flows), ...(scheme.oauth2MetadataUrl && { metadataUrl: scheme.oauth2MetadataUrl }) }
}

/**
 * Maps `components.securitySchemes` to `AuthScheme` entries by how a client sends the credential. A scheme the
 * client cannot place, such as an `apiKey` outside a header, query or cookie, is left out.
 */
export function toAuthSchemes(schemes: Record<string, unknown> | undefined, refs: Refs): Array<ast.AuthScheme> {
  return Object.entries(schemes ?? {}).flatMap(([name, value]) => {
    const scheme = refs.deref<SecuritySchemeObject>(value)
    const credential = scheme && getCredential(scheme)
    if (!scheme || !credential) return []
    const tokenSource = getTokenSource(scheme)
    return [
      {
        name,
        ...(scheme.description && { description: scheme.description }),
        ...(scheme.deprecated && { deprecated: true }),
        credential,
        ...(tokenSource && { tokenSource }),
      },
    ]
  })
}

/**
 * Maps security requirements to `AuthRequirement` entries. From 3.2 a key may be a URI to the scheme, such as
 * `#/components/securitySchemes/oauth`, which becomes `oauth`. Returns `undefined` for a missing or malformed list.
 */
export function toAuthRequirements(requirements: unknown, document: Document): Array<ast.AuthRequirement> | undefined {
  if (!Array.isArray(requirements)) return undefined
  const schemes = document.components?.securitySchemes ?? {}
  const toName = (key: string) => {
    const index = key.indexOf(SCHEME_POINTER)
    return Object.hasOwn(schemes, key) || index === -1 ? key : unescapePointerToken(key.slice(index + SCHEME_POINTER.length))
  }

  return requirements
    .filter((requirement): requirement is Record<string, unknown> => !!requirement && typeof requirement === 'object')
    .map((requirement) =>
      Object.entries(requirement).map(([key, scopes]) => ({
        scheme: toName(key),
        ...(Array.isArray(scopes) && scopes.length && { scopes: scopes.map(String) }),
      })),
    )
}
