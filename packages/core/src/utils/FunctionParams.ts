import { orderBy } from 'natural-orderby'

import { camelCase } from '../transformers/casing.ts'

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
  type?: 'generics' | 'typed'
  #items: Array<FunctionParamsAST | FunctionParamsAST[]> = []
  constructor(type?: 'generics' | 'typed') {
    this.type = type

    return this
  }

  get items(): FunctionParamsAST[] {
    return this.#items.flat()
  }

  add(item: FunctionParamsAST | Array<FunctionParamsAST | FunctionParamsAST[] | undefined> | undefined): FunctionParams {
    if (!item) {
      return this
    }

    if (Array.isArray(item)) {
      item.filter(Boolean).forEach((it) => this.#items.push(it))
      return this
    }
    this.#items.push(item)

    return this
  }
  #orderItems(items: Array<FunctionParamsAST | FunctionParamsAST[]>) {
    return orderBy(items.filter(Boolean), [
      (v) => {
        if (Array.isArray(v)) {
          return undefined
        }
        return !v.default
      },
      (v) => {
        if (Array.isArray(v)) {
          return undefined
        }
        return v.required ?? true
      },
    ], [
      'desc',
      'desc',
    ])
  }

  static #addParams(acc: string[], item: FunctionParamsAST) {
    const { enabled = true, name, type, required = true, ...rest } = item

    if (!enabled) {
      return acc
    }

    if (!name) {
      // when name is not se we will use TypeScript generics
      acc.push(`${type}${rest.default ? ` = ${rest.default}` : ''}`)

      return acc
    }
    // TODO check whey we still need the camelcase here
    const parameterName = name.startsWith('{') ? name : camelCase(name)

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
  }

  static #convertToObject(items: FunctionParamsAST[]): FunctionParamsAST {
    let type: string[] = []
    let name: string[] = []

    const enabled = items.every(item => item.enabled) ? items.at(0)?.enabled : true
    const required = items.every(item => item.required) ?? true

    items.forEach(item => {
      name = FunctionParams.#addParams(name, { ...item, type: undefined })
      if (items.some(item => item.type)) {
        type = FunctionParams.#addParams(type, item)
      }
    })

    return {
      name: `{ ${name.join(', ')} }`,
      type: type.length ? `{ ${type.join(', ')} }` : undefined,
      enabled,
      required,
    }
  }

  static toObject(item: FunctionParamsAST[]): FunctionParamsAST {
    return FunctionParams.#convertToObject(item)
  }

  toString(): string {
    const sortedData = this.#orderItems(this.#items)

    return sortedData
      .reduce((acc, item) => {
        if (Array.isArray(item)) {
          const subItems = this.#orderItems(item) as FunctionParamsAST[]
          const objectItem = FunctionParams.#convertToObject(subItems)

          return FunctionParams.#addParams(acc, objectItem)
        }

        return FunctionParams.#addParams(acc, item)
      }, [] as string[])
      .join(', ')
  }
}
