import { camelCase, camelCaseTransformMerge } from 'change-case'
import { orderBy } from 'natural-orderby'

type FunctionParamsAst = {
  name: string
  type?: string
  /**
   * @default true
   */
  required?: boolean
  /**
   * @default true
   */
  enabled?: boolean
  default?: string
}

/**
 * Convert an string array to a string of parameters that can be used inside a function
 * The parameter name is converted to `camelcase`
 */
export function createFunctionParams(data: FunctionParamsAst[]): string {
  const sortedData = orderBy(data, [(v) => v.default, (v) => v.required ?? true], ['desc', 'desc'])

  return sortedData
    .filter(({ enabled = true }) => enabled)
    .reduce((acc, { name, type, required = true, ...rest }) => {
      const parameterName = camelCase(name, { delimiter: '', transform: camelCaseTransformMerge })

      if (type) {
        if (required) {
          acc.push(`${parameterName}: ${type}${rest.default ? ` = ${rest.default}` : ''}`)
        } else {
          acc.push(`${parameterName}?: ${type}`)
        }
      } else {
        acc.push(`${parameterName}`)
      }

      return acc
    }, [] as string[])
    .join(', ')
}
