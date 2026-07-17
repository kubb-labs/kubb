import { ast } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast'

/**
 * Merges a run of adjacent anonymous object members into one. Named or non-object members break the
 * run and pass through unchanged. The merge follows member order, so callers control which members
 * combine by where they place them in the sequence.
 *
 * @example
 * ```ts
 * const merged = [...mergeAdjacentObjectsLazy([objectA, objectB])]
 * ```
 */
export function* mergeAdjacentObjectsLazy(members: Iterable<SchemaNode>): Generator<SchemaNode, void, undefined> {
  let acc: SchemaNode | undefined

  for (const member of members) {
    const objectMember = ast.narrowSchema(member, 'object')
    if (objectMember && !objectMember.name && acc !== undefined) {
      const accObject = ast.narrowSchema(acc, 'object')
      if (accObject && !accObject.name) {
        acc = ast.factory.createSchema({
          ...accObject,
          properties: [...(accObject.properties ?? []), ...(objectMember.properties ?? [])],
        })
        continue
      }
    }
    if (acc !== undefined) yield acc
    acc = member
  }

  if (acc !== undefined) yield acc
}
