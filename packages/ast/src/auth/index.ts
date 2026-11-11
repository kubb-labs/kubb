import type { AuthCredential, AuthRequirement, AuthScheme } from '../nodes/input.ts'

/**
 * One scheme of a resolved requirement: its declared name and credential, and the scopes the requirement asks for.
 */
export type ResolvedScheme = {
  name: string
  credential: AuthCredential
  scopes: Array<string>
}

/**
 * Joins each requirement with the schemes it names. The result keeps the requirements as alternatives, each one a
 * list of schemes that apply together. A requirement that names an undeclared scheme can never be met, so it is
 * left out, and so is a repeated one. An empty requirement stays, since it means the call may be sent without auth.
 *
 * Pass the `schemes` of the document the operation comes from. Which credentials a runtime can send is up to the caller.
 *
 * @example
 * ```ts
 * ast.auth.resolve([[{ scheme: 'bearer' }], [{ scheme: 'missing' }]], meta.auth)
 * // [[{ name: 'bearer', credential: { type: 'http', scheme: 'bearer' }, scopes: [] }]]
 * ```
 */
export function resolve(auth: ReadonlyArray<AuthRequirement> | undefined, schemes: ReadonlyArray<AuthScheme> | undefined): Array<Array<ResolvedScheme>> {
  const credentials = new Map(schemes?.map((scheme) => [scheme.name, scheme.credential]))
  const seen = new Set<string>()
  const resolved: Array<Array<ResolvedScheme>> = []

  for (const requirement of auth ?? []) {
    const key = requirement.map(({ scheme, scopes }) => [scheme, ...(scopes ?? [])].join(' ')).join('\0')
    if (seen.has(key) || !requirement.every(({ scheme }) => credentials.has(scheme))) continue
    seen.add(key)
    resolved.push(requirement.map(({ scheme, scopes }) => ({ name: scheme, credential: credentials.get(scheme)!, scopes: scopes ?? [] })))
  }

  return resolved
}
