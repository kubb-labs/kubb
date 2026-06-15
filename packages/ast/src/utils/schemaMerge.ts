import { narrowSchema } from '../guards.ts'
import { createSchema, type SchemaNode } from '../nodes/schema.ts'

/**
 * Merges adjacent anonymous object members into one. Used while building intersection members during
 * parsing, where neighboring inline object schemas collapse into a single object. Named members and
 * non-object members break a run, so they are yielded as-is.
 *
 * This stays a construction-time array helper rather than a macro: callers control the member
 * boundaries (for example, keeping synthetic discriminant objects out of a merge run), which a
 * whole-tree macro cannot express.
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

/**
 * Eager form of {@link mergeAdjacentObjectsLazy}.
 */
export function mergeAdjacentObjects(members: Array<SchemaNode>): Array<SchemaNode> {
  return [...mergeAdjacentObjectsLazy(members)]
}
