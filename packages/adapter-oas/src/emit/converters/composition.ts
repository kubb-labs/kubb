import { ast, extractRefName, macroSimplifyUnion, mergeAdjacentObjectsLazy } from '@kubb/kit'
import { SCHEMA_REF_PREFIX } from '../../constants.ts'
import { isDiscriminator, isReference } from '../../oas.ts'
import type { Refs } from '../../refs.ts'
import type { ReferenceObject, SchemaObject } from '../../types.ts'
import { createNode } from '../createNode.ts'
import {
  createDiscriminantNode,
  removeInheritedDiscriminator,
  extractDiscriminatedAllOfMembers,
  narrowUnionMembers,
  propertyTypeOf,
} from '../discriminator/preserve.ts'
import type { ConvertContext } from '../parseSchema.ts'
import { extractExamples } from '../schemaShape.ts'
import { convertAnnotatedEnum } from './annotatedEnum.ts'

/**
 * Collects property schemas from all `allOf` members and outer schema properties,
 * recursively resolving `$ref` pointers.
 */
function collectSiblingProperties(
  allOfMembers: Array<SchemaObject | ReferenceObject>,
  refs: Refs,
  outerProperties?: Record<string, unknown>,
): Record<string, unknown> {
  const properties: Record<string, unknown> = { ...outerProperties }
  const visited = new Set<string>()

  function collectFrom(item: SchemaObject | ReferenceObject | undefined): void {
    if (!item) return

    if (isReference(item)) {
      if (visited.has(item.$ref)) return
      visited.add(item.$ref)
      const resolved = refs.resolve<SchemaObject>(item.$ref, { report: false })
      if (resolved && !isReference(resolved)) {
        collectFrom(resolved)
      }
      return
    }

    if (item.properties) {
      Object.assign(properties, item.properties)
    }

    if (Array.isArray(item.allOf)) {
      for (const member of item.allOf) {
        collectFrom(member as SchemaObject | ReferenceObject)
      }
    }
  }

  for (const item of allOfMembers) {
    collectFrom(item)
  }

  return properties
}

/**
 * Enriches union members that declare `required` properties without declaring corresponding
 * property schemas, populating the missing property definitions from available sibling schemas
 * (or an empty schema falling back to the configured emptySchemaType).
 */
function resolveUnionMembers(members: Array<unknown>, siblingProperties: Record<string, unknown>): Array<unknown> {
  return members.map((member) => {
    if (!member || typeof member !== 'object' || isReference(member)) {
      return member
    }

    const obj = member as SchemaObject
    if (!Array.isArray(obj.required) || obj.required.length === 0) {
      return member
    }

    const existingProps = (obj.properties ?? {}) as Record<string, unknown>
    const missingKeys = obj.required.filter((key) => !Object.hasOwn(existingProps, key))

    if (missingKeys.length === 0) {
      return member
    }

    const newProperties: Record<string, unknown> = { ...existingProps }
    for (const key of missingKeys) {
      const value = Object.hasOwn(siblingProperties, key) ? siblingProperties[key] : {}
      // defineProperty: a plain assignment of a `__proto__` key would hit the prototype setter.
      Object.defineProperty(newProperties, key, { value, enumerable: true, writable: true, configurable: true })
    }

    return {
      type: obj.type ?? 'object',
      ...obj,
      properties: newProperties,
    }
  })
}

/**
 * Enriches a schema object, and any `oneOf` or `anyOf` branches on it, with properties from sibling schemas.
 */
function resolveUnionSchema(schema: SchemaObject, siblingProperties: Record<string, unknown>): SchemaObject {
  const resolvedSchema = (resolveUnionMembers([schema], siblingProperties)[0] as SchemaObject) ?? schema
  const next: SchemaObject = { ...resolvedSchema }
  if (schema.oneOf) {
    next.oneOf = resolveUnionMembers(schema.oneOf, siblingProperties) as typeof schema.oneOf
  }
  if (schema.anyOf) {
    next.anyOf = resolveUnionMembers(schema.anyOf, siblingProperties) as typeof schema.anyOf
  }
  return next
}

/**
 * Converts a `$ref` schema into a `RefSchemaNode`.
 *
 * The resolved schema is stored in `node.schema`. Usage-site sibling fields
 * (description, readOnly, nullable, etc.) are stored directly on the ref node.
 * Use `syncSchemaRef(node)` in printers to get a merged view of both.
 * Circular refs are detected in `refs.resolveNode` and leave `schema` as `null`.
 */
export function convertRef({ schema, name, nullable, defaultValue, document, parse, refs, renames }: ConvertContext): ast.SchemaNode {
  const refPath = schema.$ref
  const resolvedSchema = refPath ? refs.resolveNode(refPath, parse) : null
  const ctx = { schema, name, nullable, defaultValue }

  // A `$ref` to a component the document never defines (a malformed spec) would otherwise emit an
  // import to a module that is never generated, leaving the output uncompilable. Fall back to
  // `unknown` so the rest of the schema still resolves. Only do this for a document that declares a
  // component registry — a registry-less fragment (e.g. a minimal `parse` call) parses refs
  // leniently, since the target is expected to live outside the fragment.
  // A circular ref still resolves, so only a `$ref` to a component the spec never declares is missing.
  if (refPath && document.components && !refs.resolve(refPath, { report: false })) {
    return createNode(ctx, { type: 'unknown' })
  }

  // A target outside `components.schemas` is never emitted as its own file, so inline it. A circular
  // ref leaves `resolvedSchema` null and still becomes a ref node.
  if (refPath && !refPath.startsWith(SCHEMA_REF_PREFIX) && resolvedSchema) {
    return ast.factory.createSchema({
      ...resolvedSchema,
      title: schema.title ?? resolvedSchema.title,
      description: schema.description ?? resolvedSchema.description,
      deprecated: schema.deprecated ?? resolvedSchema.deprecated,
      readOnly: schema.readOnly ?? resolvedSchema.readOnly,
      writeOnly: schema.writeOnly ?? resolvedSchema.writeOnly,
      default: defaultValue ?? resolvedSchema.default,
      name: name ?? resolvedSchema.name,
      nullable: nullable ?? resolvedSchema.nullable,
    })
  }

  const targetName = renames?.get(schema.$ref!)

  return createNode(ctx, {
    type: 'ref',
    name: extractRefName(schema.$ref!),
    ref: schema.$ref,
    ...(targetName ? { targetName } : {}),
    schema: resolvedSchema,
  })
}

/** Converts `{ ...rest, not: X }` into `intersection[rest, not[X]]`; a bare `required` inside `not` borrows the outer `properties`. */
export function convertNot({ schema, name, nullable, defaultValue, parse }: ConvertContext): ast.SchemaNode {
  const { not, ...rest } = schema as SchemaObject & { not: SchemaObject }
  const [subschema] = resolveUnionMembers([not], (rest.properties ?? {}) as Record<string, unknown>) as [SchemaObject]
  const notNode = ast.factory.createSchema({ type: 'not', members: [parse({ schema: subschema })] })

  return createNode({ schema, name, nullable, defaultValue }, { type: 'intersection', members: [parse({ schema: rest, name }), notNode] })
}

/**
 * Keywords that describe a schema or conditionally constrain it, but add no structure.
 */
const annotationKeys = new Set(['description', 'title', 'example', 'examples', 'default', 'deprecated', 'readOnly', 'writeOnly', 'if', 'then', 'else'])

/**
 * Moves `allOf` members that hold only annotations or `if`/`then`/`else` onto the parent, so they do
 * not become `unknown`. The parent's own values win, and the conditional keywords are not enforced.
 */
function mergeAnnotations(schema: SchemaObject): SchemaObject {
  const members = schema.allOf as Array<SchemaObject | ReferenceObject>
  const isAnnotation = (member: SchemaObject | ReferenceObject) => !isReference(member) && Object.keys(member).every((key) => annotationKeys.has(key))
  const annotations = members.filter(isAnnotation)
  const rest = members.filter((member) => !isAnnotation(member))

  return annotations.length && rest.length ? { ...Object.assign({}, ...annotations), ...schema, allOf: rest } : schema
}

/**
 * Converts an `allOf` schema into a flattened node or an `IntersectionSchemaNode`.
 */
export function convertAllOf({ schema: original, name, nullable, defaultValue, parse, refs }: ConvertContext): ast.SchemaNode {
  const schema = mergeAnnotations(original)

  if (
    schema.allOf!.length === 1 &&
    !schema.properties &&
    !(Array.isArray(schema.required) && schema.required.length) &&
    schema.additionalProperties === undefined
  ) {
    const [memberSchema] = schema.allOf as Array<SchemaObject | ReferenceObject>
    const memberNode = parse({ schema: memberSchema! as SchemaObject, name })
    const { kind: _kind, ...memberNodeProps } = memberNode
    const mergedNullable = nullable || memberNode.nullable || undefined
    const mergedDefault = schema.default === null && mergedNullable ? undefined : (schema.default ?? memberNode.default)

    return ast.factory.createSchema({
      ...memberNodeProps,
      name,
      title: schema.title ?? memberNode.title,
      description: schema.description ?? memberNode.description,
      deprecated: schema.deprecated ?? memberNode.deprecated,
      nullable: mergedNullable,
      readOnly: schema.readOnly ?? memberNode.readOnly,
      writeOnly: schema.writeOnly ?? memberNode.writeOnly,
      default: mergedDefault,
      examples: extractExamples(schema) ?? memberNode.examples,
      pattern: schema.pattern ?? ('pattern' in memberNode ? memberNode.pattern : undefined),
      format: schema.format ?? memberNode.format,
    } as ast.DistributiveOmit<ast.SchemaNode, 'kind'>)
  }

  const { members: discriminatedAllOf, discriminantValues } = extractDiscriminatedAllOfMembers({
    allOfMembers: removeInheritedDiscriminator({ members: schema.allOf as Array<SchemaObject | ReferenceObject>, refs }),
    name,
    refs,
  })
  const siblingProperties = collectSiblingProperties(schema.allOf as Array<SchemaObject | ReferenceObject>, refs, schema.properties)
  const resolvedAllOf = discriminatedAllOf.map((s) => (isReference(s) ? s : resolveUnionSchema(s as SchemaObject, siblingProperties)))
  const allOfMembers: Array<ast.SchemaNode> = resolvedAllOf.map((s) => parse({ schema: s as SchemaObject, name }))

  const syntheticStart = allOfMembers.length

  if (Array.isArray(schema.required) && schema.required.length) {
    const outerKeys = schema.properties ? new Set(Object.keys(schema.properties)) : new Set<string>()
    const missingRequired = schema.required.filter((key) => !outerKeys.has(key))

    if (missingRequired.length) {
      const resolvedMembers = (schema.allOf as Array<SchemaObject | ReferenceObject>).flatMap((item) => {
        if (!isReference(item)) return [item as SchemaObject]
        const deref = refs.resolve<SchemaObject>(item.$ref)
        return deref && !isReference(deref) ? [deref] : []
      })

      for (const key of missingRequired) {
        for (const resolved of resolvedMembers) {
          const prop = resolved.properties?.[key]
          if (prop) {
            const raw = { properties: { [key]: prop }, required: [key] }
            const memberSchema = raw as SchemaObject
            allOfMembers.push(parse({ schema: memberSchema, name }))
            break
          }
        }
      }
    }
  }

  if (schema.properties) {
    const { allOf: _allOf, ...schemaWithoutAllOf } = schema
    // Don't pass `name` here, the result must stay anonymous so it can be merged with the
    // adjacent synthetic object in `mergeAdjacentObjectsLazy`. Nested enum qualification
    // happens upstream via `convertObject`'s `setEnumName` propagation.
    allOfMembers.push(parse({ schema: schemaWithoutAllOf }))
  }

  for (const { propertyName, values } of discriminantValues) {
    allOfMembers.push(createDiscriminantNode({ propertyName, values }))
  }

  return createNode(
    { schema, name, nullable, defaultValue },
    {
      type: 'intersection',
      members: [...mergeAdjacentObjectsLazy(allOfMembers.slice(0, syntheticStart)), ...mergeAdjacentObjectsLazy(allOfMembers.slice(syntheticStart))],
    },
  )
}

/**
 * Converts a `oneOf` / `anyOf` schema into a `UnionSchemaNode`.
 */
export function convertUnion(context: ConvertContext): ast.SchemaNode {
  const annotatedEnum = convertAnnotatedEnum(context)
  if (annotatedEnum) return annotatedEnum
  const { schema, name, nullable, defaultValue, parse, refs } = context
  const ctx = { schema, name, nullable, defaultValue }
  const unionMembers = resolveUnionMembers([...(schema.oneOf ?? []), ...(schema.anyOf ?? [])], schema.properties ?? {})
  const strategy: 'one' | 'any' = schema.oneOf ? 'one' : 'any'
  const explicitDiscriminatorPropertyName = isDiscriminator(schema) ? schema.discriminator.propertyName : undefined
  const discriminator = isDiscriminator(schema) ? schema.discriminator : undefined
  const { oneOf: _o, anyOf: _a, discriminator: _d, ...memberBaseSchema } = schema
  const sharedPropertiesNode = schema.properties ? parse({ schema: memberBaseSchema as SchemaObject, name }) : undefined
  const missingRequired = (Array.isArray(schema.required) ? schema.required : []).filter((key) => !Object.hasOwn(schema.properties ?? {}, key))

  if (sharedPropertiesNode || discriminator || missingRequired.length) {
    const members = narrowUnionMembers({
      unionMembers,
      discriminator,
      sharedPropertiesNode,
      parentType: discriminator && propertyTypeOf({ schema, propertyName: discriminator.propertyName, refs }),
      parse,
      name,
      refs,
    })
    const unionNode = createNode(ctx, {
      type: 'union',
      strategy,
      members,
      discriminatorPropertyName: explicitDiscriminatorPropertyName ?? ast.inferDiscriminatorPropertyName(members),
    })

    const requiredProperties = missingRequired.map((propertyName) => {
      const schemas = members.flatMap((node) => ast.resolveSchemaProperties({ node, propertyName })).map((property) => ast.optionality(property.schema, true))
      const propertySchema = schemas.length > 1 ? ast.factory.createSchema({ type: ast.schemaTypes.union, strategy: 'any', members: schemas }) : schemas[0]
      return ast.factory.createProperty({ name: propertyName, required: true, schema: propertySchema ?? parse({ schema: {} }) })
    })
    const siblings = sharedPropertiesNode ? [sharedPropertiesNode] : []
    if (requiredProperties.length) {
      siblings.push(ast.factory.createSchema({ type: ast.schemaTypes.object, properties: requiredProperties }))
    }

    if (!siblings.length) {
      return unionNode
    }

    return createNode(ctx, { type: ast.schemaTypes.intersection, members: [unionNode, ...siblings] })
  }

  const members = unionMembers.map((s) => parse({ schema: s as SchemaObject, name }))
  const unionNode = createNode(ctx, {
    type: 'union',
    strategy,
    members,
    discriminatorPropertyName: explicitDiscriminatorPropertyName ?? ast.inferDiscriminatorPropertyName(members),
  })

  return ast.applyMacros(unionNode, [macroSimplifyUnion], { depth: 'shallow' })
}

/**
 * Converts an OAS 3.1 multi-type array (e.g. `type: ['string', 'number']`) into a `UnionSchemaNode`.
 * Only called once the multi-type rule's `match` has confirmed more than one non-`null` type
 * remains; a single remaining type (e.g. `['string', 'null']`) is handled as that type instead,
 * with nullability already folded in.
 */
export function convertMultiType({ schema, name, nullable, defaultValue, parse }: ConvertContext): ast.SchemaNode {
  const types = schema.type as Array<string>
  const nonNullTypes = types.filter((t) => t !== 'null')

  const arrayNullable = types.includes('null') || nullable || undefined
  return createNode(
    { schema, name, nullable: arrayNullable, defaultValue },
    {
      type: 'union',
      members: nonNullTypes.map((t) => {
        const raw = { ...schema, type: t }
        const memberSchema = raw as SchemaObject
        return parse({ schema: memberSchema, name })
      }),
    },
  )
}
