import type { AuthCredential, AuthRequirement, AuthScheme } from '../nodes/input.ts'

/** One scheme of a resolved requirement, with the scopes the requirement asks for. */
export type ResolvedScheme = {
  name: string
  credential: AuthCredential
  scopes: Array<string>
}

/** Joins each requirement with its schemes. Drops undeclared and repeated requirements, and keeps an empty one (no auth needed). */
export function getSchemes({
  auth,
  schemes,
}: {
  auth: ReadonlyArray<AuthRequirement> | undefined
  schemes: ReadonlyArray<AuthScheme> | undefined
}): Array<Array<ResolvedScheme>> {
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
