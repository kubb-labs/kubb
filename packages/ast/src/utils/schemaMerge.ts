import { narrowSchema } from '../guards.ts'
import { createSchema, type SchemaNode } from '../nodes/schema.ts'

/**
 * Merges a run of adjacent anonymous object members into one. Named or non-object members break the
 * run and pass through. Stays a construction-time helper, not a macro, so callers keep control of the
 * member boundaries (such as keeping synthetic discriminant objects out of a run).
 *
 * @example
 * ```ts
 * const merged = [...mergeAdjacentObjectsLazy([objectA, objectB])]
 * ```
 */
export function* mergeAdjacentObjectsLazy(members: Iterable<SchemaNode>): Generator<SchemaNode, void, undefined> {
  let acc: SchemaNode | undefined

  for (const member of members) {
    const objectMember = narrowSchema(member, 'object')
    if (objectMember && !objectMember.name && acc !== undefined) {
      const accObject = narrowSchema(acc, 'object')
      if (accObject && !accObject.name) {
        acc = createSchema({
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
