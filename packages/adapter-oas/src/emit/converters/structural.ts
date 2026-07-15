import { ast, childName, enumPropName, macroDiscriminatorEnum, macroEnumName } from '@kubb/ast'
import { isDiscriminator, isNullable } from '../../oas.ts'
import type { SchemaObject } from '../../types.ts'
import { createNode } from '../createNode.ts'
import type { ConvertContext } from '../parseSchema.ts'

/**
 * Names the inline enums on a property's schema, and on each item when the property is a tuple, from
 * the parent and property name. Wraps `macroEnumName` at the property construction site.
 */
function nameEnums(node: ast.SchemaNode, options: { parentName: string | null | undefined; propName: string; enumSuffix: string }): ast.SchemaNode {
  const macro = macroEnumName(options)
  const named = ast.applyMacros(node, [macro], { depth: 'shallow' })
  const tupleNode = ast.narrowSchema(named, 'tuple')
  if (tupleNode?.items) {
    const namedItems = tupleNode.items.map((item) => ast.applyMacros(item, [macro], { depth: 'shallow' }))
    if (namedItems.some((item, i) => item !== tupleNode.items![i])) {
      return { ...tupleNode, items: namedItems }
    }
  }
  return named
}

/**
 * Converts an object-like schema into an `ObjectSchemaNode`.
 */
export function convertObject({ schema, name, nullable, defaultValue, rawOptions, options, parse }: ConvertContext): ast.SchemaNode {
  const properties: Array<ast.PropertyNode> = schema.properties
    ? Object.entries(schema.properties).map(([propName, propSchema]) => {
        const required = Array.isArray(schema.required) ? schema.required.includes(propName) : !!schema.required
        const resolvedPropSchema = propSchema as SchemaObject
        const propNullable = isNullable(resolvedPropSchema)

        const resolvedChildName = childName(name, propName)
        const propNode = parse({ schema: resolvedPropSchema, name: resolvedChildName }, rawOptions)
        const schemaNode = nameEnums(propNode, { parentName: name, propName, enumSuffix: options.enumSuffix })

        return ast.factory.createProperty({
          name: propName,
          schema: {
            ...schemaNode,
            nullable: schemaNode.type === 'null' ? undefined : propNullable || undefined,
          },
          required,
        })
      })
    : []

  const additionalProperties = schema.additionalProperties
  const additionalPropertiesNode: ast.SchemaNode | boolean | undefined = (() => {
    if (additionalProperties === true) return true
    if (additionalProperties === false) return false
    if (additionalProperties && Object.keys(additionalProperties).length > 0) {
      return parse({ schema: additionalProperties as SchemaObject }, rawOptions)
    }
    if (additionalProperties) return ast.factory.createSchema({ type: options.unknownType })
    return undefined
  })()

  const rawPatternProperties = 'patternProperties' in schema ? schema.patternProperties : undefined

  const patternProperties = rawPatternProperties
    ? Object.fromEntries(
        Object.entries(rawPatternProperties).map(([pattern, patternSchema]) => [
          pattern,
          patternSchema === true || (typeof patternSchema === 'object' && Object.keys(patternSchema).length === 0)
            ? ast.factory.createSchema({
                type: options.unknownType,
              })
            : parse({ schema: patternSchema as SchemaObject }, rawOptions),
        ]),
      )
    : undefined

  const objectNode: ast.SchemaNode = createNode(
    { schema, name, nullable, defaultValue },
    {
      type: 'object',
      primitive: 'object',
      properties,
      additionalProperties: additionalPropertiesNode,
      patternProperties,
      minProperties: schema.minProperties,
      maxProperties: schema.maxProperties,
    },
  )

  if (isDiscriminator(schema) && schema.discriminator.mapping) {
    const discPropName = schema.discriminator.propertyName
    const values = Object.keys(schema.discriminator.mapping)
    const enumName = name ? enumPropName(name, discPropName, options.enumSuffix) : undefined
    return ast.applyMacros(objectNode, [macroDiscriminatorEnum({ propertyName: discPropName, values, enumName })], { depth: 'shallow' })
  }

  return objectNode
}

/**
 * Converts an OAS 3.1 `prefixItems` tuple into a `TupleSchemaNode`.
 */
export function convertTuple({ schema, name, nullable, defaultValue, rawOptions, parse }: ConvertContext): ast.SchemaNode {
  const tupleItems = (schema.prefixItems ?? []).map((item) => parse({ schema: item as SchemaObject }, rawOptions))
  // items: false closes the tuple; absent/true widens the tail to any.
  const rest =
    schema.items === false
      ? undefined
      : !schema.items || schema.items === true
        ? ast.factory.createSchema({ type: 'any' })
        : parse({ schema: schema.items as SchemaObject }, rawOptions)

  return createNode(
    { schema, name, nullable, defaultValue },
    {
      type: 'tuple',
      primitive: 'array',
      items: tupleItems,
      rest,
      min: schema.minItems,
      max: schema.maxItems,
    },
  )
}

/**
 * Converts a `type: 'array'` schema into an `ArraySchemaNode`.
 */
export function convertArray({ schema, name, nullable, defaultValue, rawOptions, options, parse }: ConvertContext): ast.SchemaNode {
  const rawItems = schema.items as SchemaObject | undefined
  const itemName = rawItems?.enum?.length && name ? enumPropName(null, name, options.enumSuffix) : name
  const items = rawItems ? [parse({ schema: rawItems, name: itemName }, rawOptions)] : []

  return createNode(
    { schema, name, nullable, defaultValue },
    {
      type: 'array',
      primitive: 'array',
      items,
      min: schema.minItems,
      max: schema.maxItems,
      unique: schema.uniqueItems ?? undefined,
    },
  )
}
