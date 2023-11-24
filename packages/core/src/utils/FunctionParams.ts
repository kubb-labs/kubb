import { orderBy } from 'natural-orderby'

import transformers from '../transformers/index.ts'

type FunctionParamsASTWithoutType = {
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

type FunctionParamsASTWithType = {
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

export type FunctionParamsAST = FunctionParamsASTWithoutType | FunctionParamsASTWithType
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
        // TODO check whey we still need the camelcase here
        const parameterName = name.startsWith('{') ? name : transformers.camelCase(name)

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
