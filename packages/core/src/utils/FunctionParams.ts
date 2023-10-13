import { camelCase, camelCaseTransformMerge } from 'change-case'
import { orderBy } from 'natural-orderby'

import type { FunctionParamsAST } from './createFunctionParams.ts'

export class FunctionParams {
  public type?: 'generics' | 'typed'
  public items: FunctionParamsAST[] = []
  constructor(type?: 'generics' | 'typed') {
    this.type = type

    return this
  }

  add(item: FunctionParamsAST | Array<FunctionParamsAST | undefined> | undefined): FunctionParams {
    if (!item) {
      return this
    }

    if (Array.isArray(item)) {
      item.filter(Boolean).forEach((it) => this.items.push(it))
      return this
    }
    this.items.push(item)

    return this
  }

  toString(): string {
    const sortedData = orderBy(this.items.filter(Boolean), [(v) => !v.default, (v) => v.required ?? true], ['desc', 'desc'])

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
}
