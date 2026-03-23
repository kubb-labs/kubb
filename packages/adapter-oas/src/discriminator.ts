import { createProperty, createSchema } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'

export function resolveDiscriminatorValue(mapping: Record<string, string> | undefined, ref: string | undefined): string | undefined {
  if (!mapping || !ref) return undefined
  return Object.entries(mapping).find(([, value]) => value === ref)?.[0]
}

export function createDiscriminantNode(propertyName: string, value: string): SchemaNode {
  return createSchema({
    type: 'object',
    primitive: 'object',
    properties: [
      createProperty({
        name: propertyName,
        schema: createSchema({
          type: 'enum',
          primitive: 'string',
          enumValues: [value],
        }),
        required: true,
      }),
    ],
  })
}
