import { camelCase, camelCaseTransformMerge } from 'change-case'
import { orderBy } from 'natural-orderby'

type FunctionParamsAST =
  | {
      name?: string
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
  | {
      name?: never
      type: string
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
export function createFunctionParams(ast: FunctionParamsAST[]): string {
  const sortedData = orderBy(ast, [(v) => !v.default, (v) => v.required ?? true], ['desc', 'desc'])

  return sortedData
    .filter(({ enabled = true }) => enabled)
    .reduce((acc, { name, type, required = true, ...rest }) => {
      if (!name) {
        // when name is not se we will use TypeScript generics
        acc.push(`${type}${rest.default ? ` = ${rest.default}` : ''}`)

        return acc
      }

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
