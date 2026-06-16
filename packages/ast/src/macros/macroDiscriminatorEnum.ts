import { defineMacro } from '../defineMacro.ts'
import { narrowSchema } from '../guards.ts'
import { createProperty } from '../nodes/property.ts'
import { createSchema } from '../nodes/schema.ts'

type Props = {
  propertyName: string
  values: Array<string>
  enumName?: string
}

/**
 * Builds a macro that replaces a discriminator property's schema with a string enum of the given
 * values. Object schemas that lack the property are returned unchanged.
 *
 * @example
 * ```ts
 * const macro = macroDiscriminatorEnum({ propertyName: 'type', values: ['dog', 'cat'] })
 * const next = applyMacros(objectSchema, [macro], { depth: 'shallow' })
 * ```
 */
export function macroDiscriminatorEnum({ propertyName, values, enumName }: Props) {
  return defineMacro({
    name: 'discriminator-enum',
    schema(node) {
      const objectNode = narrowSchema(node, 'object')
      if (!objectNode?.properties?.length) return undefined
      if (!objectNode.properties.some((prop) => prop.name === propertyName)) return undefined

      return createSchema({
        ...objectNode,
        properties: objectNode.properties.map((prop) => {
          if (prop.name !== propertyName) return prop

          return createProperty({
            ...prop,
            schema: createSchema({
              type: 'enum',
              primitive: 'string',
              enumValues: values,
              name: enumName,
              readOnly: prop.schema.readOnly,
              writeOnly: prop.schema.writeOnly,
            }),
          })
        }),
      })
    },
  })
}
