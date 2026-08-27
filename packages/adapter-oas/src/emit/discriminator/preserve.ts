import { ast } from '@kubb/ast'
import { extractRefName, macroDiscriminatorEnum } from '@kubb/kit'
import { SCHEMA_REF_PREFIX } from '../../constants.ts'
import { isDiscriminator, isReference } from '../../oas.ts'
import type { Refs } from '../../refs.ts'
import type { DiscriminatorObject, ReferenceObject, SchemaObject } from '../../types.ts'
import type { ParseFn } from '../parseSchema.ts'

/**
 * Creates a single-property object schema used as a discriminator literal.
 *
 * @example
 * ```ts
 * createDiscriminantNode({ propertyName: 'type', values: ['dog'] })
 * // -> { type: 'object', properties: [{ name: 'type', required: true, schema: enum('dog') }] }
 * ```
 */
export function createDiscriminantNode({ propertyName, values }: { propertyName: string; values: Array<string> }): ast.SchemaNode {
  return ast.factory.createSchema({
    type: 'object',
    primitive: 'object',
    properties: [
      ast.factory.createProperty({
        name: propertyName,
        schema: ast.factory.createSchema({
          type: 'enum',
          primitive: 'string',
          enumValues: values,
        }),
        required: true,
      }),
    ],
  })
}

/**
 * Returns every discriminator key whose mapping value matches `ref`, in mapping order.
 *
 * A mapping may point several keys at the same schema, in which case the member has to be
 * narrowed to all of them — keeping only the first would drop the rest from the union.
 *
 * @example
 * ```ts
 * findDiscriminators({ dog: '#/components/schemas/Dog', hound: '#/components/schemas/Dog' }, '#/components/schemas/Dog') // ['dog', 'hound']
 * ```
 */
export function findDiscriminators(mapping: Record<string, string> | undefined, ref: string | undefined): Array<string> {
  if (!mapping || !ref) return []
  return Object.entries(mapping)
    .filter(([, value]) => value === ref)
    .map(([key]) => key)
}

/**
 * Narrows each `oneOf`/`anyOf` member with its discriminant value, intersecting the member's own
 * node with either the shared-properties slice carrying that value, or a synthetic discriminant
 * literal. The referenced child schema's own definition is left untouched — narrowing happens only
 * at this union usage site, which is what makes this mode "preserve" (as opposed to `propagate`,
 * which additionally patches the child schema's own definition in a post-pass).
 */
export function narrowUnionMembers({
  unionMembers,
  discriminator,
  sharedPropertiesNode,
  parse,
  rawOptions,
  name,
  refs,
}: {
  unionMembers: Array<unknown>
  discriminator: DiscriminatorObject | undefined
  sharedPropertiesNode: ast.SchemaNode | undefined
  parse: ParseFn
  rawOptions: Partial<ast.ParserOptions> | undefined
  name: string | null | undefined
  refs: Refs
}): Array<ast.SchemaNode> {
  function pickDiscriminatorPropertyNode(node: ast.SchemaNode, propertyName: string): ast.SchemaNode | null {
    const objectNode = ast.narrowSchema(node, 'object')
    const discriminatorProperty = objectNode?.properties?.find((property) => property.name === propertyName)

    if (!discriminatorProperty) {
      return null
    }

    return ast.factory.createSchema({
      type: 'object',
      primitive: 'object',
      properties: [discriminatorProperty],
    })
  }

  function implicitDiscriminantValue(member: unknown): string | null {
    if (!discriminator || discriminator.mapping || !isReference(member)) return null
    const value = extractRefName(member.$ref)
    if (!value) return null
    // Silent walk — the reporting resolve() would flag missing refs as errors during speculative lookup.
    const variant = refs.resolve<SchemaObject>(member.$ref, { report: false })
    if (!variant) return null

    const propertyName = discriminator.propertyName
    // Intersecting two different literals on the same property collapses it to `never`,
    // so skip folding the implicit name when the variant already pins the discriminator.
    const seen = new Set([member.$ref])

    function constrains(v: SchemaObject): boolean {
      const prop = v.properties?.[propertyName]
      const resolved = prop && isReference(prop) ? refs.resolve<SchemaObject>(prop.$ref, { report: false }) : (prop as SchemaObject | undefined)
      if (resolved && (Array.isArray(resolved.enum) || resolved.const !== undefined)) return true
      const composition = v.allOf ?? v.oneOf ?? v.anyOf
      if (!composition) return false

      return composition.some((m) => {
        if (!isReference(m)) return constrains(m as SchemaObject)
        if (seen.has(m.$ref)) return false
        seen.add(m.$ref)
        const r = refs.resolve<SchemaObject>(m.$ref, { report: false })
        return r ? constrains(r) : false
      })
    }

    return constrains(variant) ? null : value
  }

  return unionMembers.map((s) => {
    const ref = isReference(s) ? s.$ref : undefined
    const mappedValues = findDiscriminators(discriminator?.mapping, ref)
    const implicitValue = mappedValues.length ? null : implicitDiscriminantValue(s)
    const discriminatorValues = mappedValues.length ? mappedValues : implicitValue ? [implicitValue] : []
    const memberNode = parse({ schema: s as SchemaObject, name }, rawOptions)

    if (!discriminatorValues.length || !discriminator) {
      return memberNode
    }

    const narrowedDiscriminatorNode = sharedPropertiesNode
      ? pickDiscriminatorPropertyNode(
          ast.applyMacros(sharedPropertiesNode, [macroDiscriminatorEnum({ propertyName: discriminator.propertyName, values: discriminatorValues })], {
            depth: 'shallow',
          }),
          discriminator.propertyName,
        )
      : undefined

    return ast.factory.createSchema({
      type: 'intersection',
      members: [
        memberNode,
        narrowedDiscriminatorNode ??
          createDiscriminantNode({
            propertyName: discriminator.propertyName,
            values: discriminatorValues,
          }),
      ],
    })
  })
}

/**
 * Filters the discriminated members out of an `allOf` list: an `allOf` member that `$ref`s a
 * discriminated union's parent, where this schema is itself one of that union's children, is
 * dropped from `members` and its discriminant value collected instead — the same synthetic
 * literal `narrowUnionMembers` produces, so the emitted node stays a plain intersection rather
 * than nesting the whole parent union one level deeper.
 */
export function extractDiscriminatedAllOfMembers({
  allOfMembers,
  name,
  refs,
}: {
  allOfMembers: Array<SchemaObject | ReferenceObject>
  name: string | null | undefined
  refs: Refs
}): {
  members: Array<SchemaObject | ReferenceObject>
  discriminantValues: Array<{ propertyName: string; values: Array<string> }>
} {
  const discriminantValues: Array<{ propertyName: string; values: Array<string> }> = []

  const members = allOfMembers.filter((item) => {
    if (!isReference(item) || !name) return true
    const deref = refs.resolve<SchemaObject>(item.$ref)
    if (!deref || !isDiscriminator(deref)) return true
    const parentUnion = deref.oneOf ?? deref.anyOf
    if (!parentUnion) return true
    const childRef = `${SCHEMA_REF_PREFIX}${name}`
    const inOneOf = parentUnion.some((oneOfItem) => isReference(oneOfItem) && oneOfItem.$ref === childRef)
    const inMapping = Object.values(deref.discriminator.mapping ?? {}).some((v) => v === childRef)
    if (inOneOf || inMapping) {
      const values = findDiscriminators(deref.discriminator.mapping, childRef)
      if (values.length) {
        discriminantValues.push({
          propertyName: deref.discriminator.propertyName,
          values,
        })
      }
      return false
    }
    return true
  })

  return { members, discriminantValues }
}
