import transformers, { isValidVarName } from '@kubb/core/transformers'
import type { SchemaObject } from '@kubb/oas'

/**
 * Apply casing transformation to schema properties
 * Only transforms property names, not nested schemas
 */
export function applyParamsCasing(schema: SchemaObject, casing: 'camelcase' | undefined): SchemaObject {
  if (!casing || !schema.properties) {
    return schema
  }

  const transformedProperties: Record<string, any> = {}
  const transformedRequired: string[] = []

  // Transform property names
  Object.entries(schema.properties).forEach(([originalName, propertySchema]) => {
    let transformedName = originalName

    if (casing === 'camelcase') {
      transformedName = transformers.camelCase(originalName)
    } else if (!isValidVarName(originalName)) {
      // If not valid variable name, make it valid
      transformedName = transformers.camelCase(originalName)
    }

    transformedProperties[transformedName] = propertySchema
  })

  // Transform required field names
  if (Array.isArray(schema.required)) {
    schema.required.forEach((originalName) => {
      let transformedName = originalName

      if (casing === 'camelcase') {
        transformedName = transformers.camelCase(originalName)
      } else if (!isValidVarName(originalName)) {
        transformedName = transformers.camelCase(originalName)
      }

      transformedRequired.push(transformedName)
    })
  }

  // Return a new schema with transformed properties and required fields
  return {
    ...schema,
    properties: transformedProperties,
    ...(transformedRequired.length > 0 && { required: transformedRequired }),
  } as SchemaObject
}

/**
 * Check if this schema is a parameter schema (pathParams, queryParams, or headerParams)
 * Only these should be transformed, not response/data/body
 */
export function isParameterSchema(schemaName: string): boolean {
  const lowerName = schemaName.toLowerCase()
  return lowerName.includes('pathparams') || lowerName.includes('queryparams') || lowerName.includes('headerparams')
}
