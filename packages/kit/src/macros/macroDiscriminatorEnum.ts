import { ast } from '@kubb/ast'

type Props = {
  propertyName: string
  values: Array<string | number | boolean>
  enumName?: string
}

/**
 * Builds a macro that replaces a discriminator property's schema with an enum of the given
 * values, typed as string, number or boolean after the first value. Object schemas that lack the property are returned unchanged.
 *
 * @example
 * ```ts
 * const macro = macroDiscriminatorEnum({ propertyName: 'type', values: ['dog', 'cat'] })
 * const next = applyMacros(objectSchema, [macro], { depth: 'shallow' })
 * ```
 */
export function macroDiscriminatorEnum({ propertyName, values, enumName }: Props) {
  return ast.defineMacro({
    name: 'discriminator-enum',
    schema(node) {
      const objectNode = ast.narrowSchema(node, 'object')
      if (!objectNode?.properties?.length) return undefined
      if (!objectNode.properties.some((prop) => prop.name === propertyName)) return undefined

      return ast.factory.createSchema({
        ...objectNode,
        properties: objectNode.properties.map((prop) => {
          if (prop.name !== propertyName) return prop

          return ast.factory.createProperty({
            ...prop,
            schema: ast.factory.createSchema({
              type: 'enum',
              primitive: typeof values[0] === 'number' ? 'number' : typeof values[0] === 'boolean' ? 'boolean' : 'string',
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
