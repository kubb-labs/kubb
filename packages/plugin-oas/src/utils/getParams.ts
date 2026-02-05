import { camelCase, isValidVarName } from '@kubb/core/transformers'
import type { FunctionParamsAST } from '@kubb/core/utils'
import type { OasTypes } from '@kubb/oas'
import type { Params } from '@kubb/react-fabric/types'
import type { OperationSchema } from '../types.ts'
/**
 *
 * @deprecated
 * TODO move to operationManager hook
 */
export function getASTParams(
  operationSchema: OperationSchema | undefined,
  {
    typed = false,
    casing,
    override,
  }: {
    typed?: boolean
    casing?: 'camelcase'
    override?: (data: FunctionParamsAST) => FunctionParamsAST
  } = {},
): FunctionParamsAST[] {
  if (!operationSchema || !operationSchema.schema.properties || !operationSchema.name) {
    return []
  }

  const requiredFields = Array.isArray(operationSchema.schema.required) ? operationSchema.schema.required : []

  return Object.entries(operationSchema.schema.properties).map(([name]: [string, OasTypes.SchemaObject]) => {
    // Use camelCase name for indexed access if casing is enabled
    const accessName = casing === 'camelcase' ? camelCase(name) : name

    const data: FunctionParamsAST = {
      name,
      enabled: !!name,
      required: requiredFields.includes(name),
      type: typed ? `${operationSchema.name}["${accessName}"]` : undefined,
    }

    return override ? override(data) : data
  })
}

export function getPathParams(
  operationSchema: OperationSchema | undefined,
  options: {
    typed?: boolean
    casing?: 'camelcase'
    override?: (data: FunctionParamsAST) => FunctionParamsAST
  } = {},
) {
  return getASTParams(operationSchema, options).reduce((acc, curr) => {
    if (curr.name && curr.enabled) {
      let name = curr.name

      // Only transform to camelCase if explicitly requested
      if (options.casing === 'camelcase') {
        name = camelCase(name)
      } else if (!isValidVarName(name)) {
        // If not valid variable name and casing not set, still need to make it valid
        name = camelCase(name)
      }

      acc[name] = {
        default: curr.default,
        type: curr.type,
        optional: !curr.required,
      }
    }

    return acc
  }, {} as Params)
}

/**
 * Get a mapping of camelCase parameter names to their original names
 * Used for mapping function parameters to backend parameter names
 */
export function getParamsMapping(
  operationSchema: OperationSchema | undefined,
  options: {
    casing?: 'camelcase'
  } = {},
): Record<string, string> | undefined {
  if (!operationSchema || !operationSchema.schema.properties) {
    return undefined
  }

  const mapping: Record<string, string> = {}

  Object.entries(operationSchema.schema.properties).forEach(([originalName]) => {
    let transformedName = originalName

    // Only transform to camelCase if explicitly requested
    if (options.casing === 'camelcase') {
      transformedName = camelCase(originalName)
    } else if (!isValidVarName(originalName)) {
      // If not valid variable name and casing not set, still need to make it valid
      transformedName = camelCase(originalName)
    }

    // Only add mapping if the names differ
    if (transformedName !== originalName) {
      mapping[originalName] = transformedName
    }
  })

  return Object.keys(mapping).length > 0 ? mapping : undefined
}

/**
 * @deprecated Use getParamsMapping instead
 */
export const getPathParamsMapping = getParamsMapping
