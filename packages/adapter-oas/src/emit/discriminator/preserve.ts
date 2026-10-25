import { ast, enumPrimitive, extractRefName, macroDiscriminatorEnum } from '@kubb/kit'
import { SCHEMA_REF_PREFIX } from '../../constants.ts'
import { isDiscriminator, isReference } from '../../oas.ts'
import type { Refs } from '../../refs.ts'
import type { DiscriminatorObject, ReferenceObject, SchemaObject } from '../../types.ts'
import type { ParseFn } from '../parseSchema.ts'

type DiscriminatorValue = string | number | boolean

/**
 * Turns string mapping keys into the discriminator property's type when they parse cleanly.
 */
export function typedKeys(keys: Array<string>, propertyType: unknown): Array<DiscriminatorValue> {
  return keys.map((key) => {
    if (propertyType === 'integer' || propertyType === 'number') {
      const value = Number(key)
      return key.trim() !== '' && Number.isFinite(value) ? value : key
    }
    if (propertyType === 'boolean') {
      const lower = key.toLowerCase()
      return lower === 'true' ? true : lower === 'false' ? false : key
    }
    return key
  })
}

/**
 * Reads the declared `type` of `propertyName` on a schema, following `$ref`s and `allOf` members.
 * A nullable array such as `['integer', 'null']` reads as its one non-null type.
 */
export function propertyTypeOf(schema: SchemaObject | ReferenceObject | undefined, propertyName: string, refs: Refs, seen = new Set<string>()): unknown {
  const deref = (value: SchemaObject | ReferenceObject | undefined) =>
    value && isReference(value) ? refs.resolve<SchemaObject>(value.$ref, { report: false }) : value

  if (schema && isReference(schema)) {
    if (seen.has(schema.$ref)) return undefined
    seen.add(schema.$ref)
  }

  const resolved = deref(schema) as SchemaObject | undefined
  const type =
    (deref(resolved?.properties?.[propertyName] as SchemaObject | ReferenceObject | undefined) as SchemaObject | undefined)?.type ??
    resolved?.allOf?.map((member) => propertyTypeOf(member as SchemaObject | ReferenceObject, propertyName, refs, seen)).find(Boolean)
  const nonNull = Array.isArray(type) ? type.filter((t) => t !== 'null') : []

  return nonNull.length === 1 ? nonNull[0] : type
}

/**
 * Creates a single-property object schema used as a discriminator literal.
 *
 * @example
 * ```ts
 * createDiscriminantNode({ propertyName: 'type', values: ['dog'] })
 * // -> { type: 'object', properties: [{ name: 'type', required: true, schema: enum('dog') }] }
 * ```
 */
export function createDiscriminantNode({ propertyName, values }: { propertyName: string; values: Array<DiscriminatorValue> }): ast.SchemaNode {
  return ast.factory.createSchema({
    type: 'object',
    primitive: 'object',
    properties: [
      ast.factory.createProperty({
        name: propertyName,
        schema: ast.factory.createSchema({
          type: 'enum',
          primitive: enumPrimitive(values),
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
 * Finds the discriminator a schema declares itself or through an inline `allOf` member.
 */
function ownDiscriminator(schema: SchemaObject): DiscriminatorObject | undefined {
  return (isDiscriminator(schema) ? schema : (schema.allOf as Array<SchemaObject> | undefined)?.find(isDiscriminator))?.discriminator
}

/**
 * Lists the mapping keys of a discriminator plus the keys of the nested discriminators its mapped
 * schemas declare on the same property, so a root `$type` accepts values from every level.
 */
export function mappingKeys({ propertyName, mapping }: DiscriminatorObject, refs: Refs, seen = new Set<string>()): Array<string> {
  return Object.entries(mapping ?? {}).flatMap(([key, target]) => {
    const resolved = seen.has(target) ? null : refs.resolve<SchemaObject>(target, { report: false })
    const nested = resolved && ownDiscriminator(resolved)
    seen.add(target)

    return nested?.propertyName === propertyName ? [key, ...mappingKeys(nested, refs, seen)] : [key]
  })
}

/**
 * Drops the discriminator from an inline `allOf` member when a `$ref` sibling already declares one on
 * the same property. That mapping names the schema's own children, and keeping it pins the property
 * to those keys next to the parent's, which leaves `never`.
 */
export function dropInheritedDiscriminator(members: Array<SchemaObject | ReferenceObject>, refs: Refs): Array<SchemaObject | ReferenceObject> {
  const inherited = new Set(
    members.flatMap((member) => {
      const parent = isReference(member) ? refs.resolve<SchemaObject>(member.$ref, { report: false }) : null
      return (parent && ownDiscriminator(parent)?.propertyName) || []
    }),
  )

  return members.map((member) => {
    if (isReference(member) || !isDiscriminator(member) || member.oneOf || member.anyOf || !inherited.has(member.discriminator.propertyName)) return member
    const { discriminator: _discriminator, ...rest } = member

    return rest
  })
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
  parentType,
  parse,
  name,
  refs,
}: {
  unionMembers: Array<unknown>
  discriminator: DiscriminatorObject | undefined
  sharedPropertiesNode: ast.SchemaNode | undefined
  parentType?: unknown
  parse: ParseFn
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
    const propertyType = propertyTypeOf(s as SchemaObject, discriminator?.propertyName ?? '', refs) ?? parentType
    const discriminatorValues = typedKeys(mappedValues.length ? mappedValues : implicitValue ? [implicitValue] : [], propertyType)
    const memberNode = parse({ schema: s as SchemaObject, name })

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
  discriminantValues: Array<{ propertyName: string; values: Array<DiscriminatorValue> }>
} {
  const discriminantValues: Array<{ propertyName: string; values: Array<DiscriminatorValue> }> = []

  const members = allOfMembers.filter((item) => {
    if (!isReference(item) || !name) return true
    const deref = refs.resolve<SchemaObject>(item.$ref)
    const nested = deref && !isDiscriminator(deref) ? ownDiscriminator(deref) : undefined
    if (nested) {
      const values = findDiscriminators(nested.mapping, `${SCHEMA_REF_PREFIX}${name}`)
      if (values.length)
        discriminantValues.push({ propertyName: nested.propertyName, values: typedKeys(values, propertyTypeOf(deref!, nested.propertyName, refs)) })
      return true
    }
    if (!deref || !isDiscriminator(deref)) return true
    const parentUnion = deref.oneOf ?? deref.anyOf
    if (!parentUnion) return true
    const childRef = `${SCHEMA_REF_PREFIX}${name}`
    const inOneOf = parentUnion.some((oneOfItem) => isReference(oneOfItem) && oneOfItem.$ref === childRef)
    const inMapping = Object.values(deref.discriminator.mapping ?? {}).some((v) => v === childRef)
    if (inOneOf || inMapping) {
      const values = findDiscriminators(deref.discriminator.mapping, childRef)
      if (values.length) {
        const { propertyName } = deref.discriminator
        const propertyType = propertyTypeOf(deref, propertyName, refs) ?? propertyTypeOf({ $ref: childRef }, propertyName, refs)
        discriminantValues.push({ propertyName, values: typedKeys(values, propertyType) })
      }
      return false
    }
    return true
  })

  return { members, discriminantValues }
}
