import { bench, describe } from 'vitest'
import { createProperty, createSchema } from './factory.ts'
import { narrowSchema } from './guards.ts'
import { mergeAdjacentObjects } from './transformers.ts'
import type { SchemaNode } from './nodes/schema.ts'

// Original reduce-based implementation (pre-generator)
function mergeAdjacentObjectsOld(members: Array<SchemaNode>): Array<SchemaNode> {
  return members.reduce<Array<SchemaNode>>((acc, member) => {
    const objectMember = narrowSchema(member, 'object')
    if (objectMember && !objectMember.name) {
      const previous = acc.at(-1)
      const previousObject = previous ? narrowSchema(previous, 'object') : undefined
      if (previousObject && !previousObject.name) {
        acc[acc.length - 1] = createSchema({
          ...previousObject,
          properties: [...(previousObject.properties ?? []), ...(objectMember.properties ?? [])],
        })
        return acc
      }
    }
    acc.push(member)
    return acc
  }, [])
}

// Build a deterministic mix: ~40 % anonymous objects (mergeable), rest named/scalar
function makeMembers(count: number): Array<SchemaNode> {
  const str = createSchema({ type: 'string' })
  const num = createSchema({ type: 'number' })
  const members: Array<SchemaNode> = []
  for (let i = 0; i < count; i++) {
    const mod = i % 5
    if (mod === 0 || mod === 1) {
      // anonymous object — adjacent pairs will be merged
      members.push(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: `p${i}`, required: false, schema: str })],
        }),
      )
    } else if (mod === 2) {
      // named object — not mergeable
      members.push(
        createSchema({
          type: 'object',
          name: `Named${i}`,
          properties: [createProperty({ name: `n${i}`, required: true, schema: num })],
        }),
      )
    } else if (mod === 3) {
      members.push(str)
    } else {
      members.push(num)
    }
  }
  return members
}

const small = makeMembers(20)
const medium = makeMembers(200)
const large = makeMembers(2_000)

describe('mergeAdjacentObjects — reduce (old) vs generator (new)', () => {
  describe('small · 20 members', () => {
    bench('reduce / old', () => {
      mergeAdjacentObjectsOld(small)
    })
    bench('generator / new', () => {
      mergeAdjacentObjects(small)
    })
  })

  describe('medium · 200 members', () => {
    bench('reduce / old', () => {
      mergeAdjacentObjectsOld(medium)
    })
    bench('generator / new', () => {
      mergeAdjacentObjects(medium)
    })
  })

  describe('large · 2 000 members', () => {
    bench('reduce / old', () => {
      mergeAdjacentObjectsOld(large)
    })
    bench('generator / new', () => {
      mergeAdjacentObjects(large)
    })
  })
})
