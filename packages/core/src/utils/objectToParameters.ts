import { camelCase, camelCaseTransformMerge } from 'change-case'

type Data = string[][]

type Options = {
  typed?: boolean
}
/**
 * Convert an string array to a string of parameters that can be used inside a function
 * The parameter name is converted to `camelcase`
 */
export function objectToParameters(data: Data, options: Options = {}) {
  const { typed } = options

  return data
    .reduce((acc, [key, value]) => {
      const parameterName = camelCase(key, { delimiter: '', transform: camelCaseTransformMerge })

      if (typed) {
        acc.push(`${parameterName}: ${value}["${key}"]`)
      } else {
        acc.push(`${parameterName}`)
      }

      return acc
    }, [] as string[])
    .join(', ')
}
