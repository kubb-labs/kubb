import { sortBy } from 'remeda'
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
/**
 * @deprecated
 */
export type FunctionParamsAST = FunctionParamsASTWithoutType | FunctionParamsASTWithType

/**
 * @deprecated
 */
export class FunctionParams {
  #items: Array<FunctionParamsAST | FunctionParamsAST[]> = []
  constructor() {
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
      item.filter(Boolean).forEach((it) => {
        this.#items.push(it)
      })
      return this
    }
    this.#items.push(item)

    return this
  }
  static #orderItems(items: Array<FunctionParamsAST | FunctionParamsAST[]>) {
    return sortBy(
      items.filter(Boolean),
      [item => Array.isArray(item), 'desc'],                                                          // arrays (rest params) first
      [item => !Array.isArray(item) && (item as FunctionParamsAST).default !== undefined, 'asc'],    // no-default before has-default
      [item => Array.isArray(item) || ((item as FunctionParamsAST).required ?? true), 'desc'],       // required before optional
    )
  }

  static #addParams(acc: string[], item: FunctionParamsAST) {
    const { enabled = true, name, type, required = true, ...rest } = item

    if (!enabled) {
      return acc
    }

    if (!name) {
      // when name is not se we uses TypeScript generics
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

  static toObject(items: FunctionParamsAST[]): FunctionParamsAST {
    let type: string[] = []
    let name: string[] = []

    const enabled = items.every((item) => item.enabled) ? items.at(0)?.enabled : true
    const required = items.every((item) => item.required) ?? true

    items.forEach((item) => {
      name = FunctionParams.#addParams(name, { ...item, type: undefined })
      if (items.some((item) => item.type)) {
        type = FunctionParams.#addParams(type, item)
      }
    })

    return {
      name: `{ ${name.join(', ')} }`,
      type: type.length ? `{ ${type.join('; ')} }` : undefined,
      enabled,
      required,
    }
  }

  toObject(): FunctionParamsAST {
    const items = FunctionParams.#orderItems(this.#items).flat()

    return FunctionParams.toObject(items)
  }

  static toString(items: (FunctionParamsAST | FunctionParamsAST[])[]): string {
    const sortedData = FunctionParams.#orderItems(items)

    return sortedData
      .reduce((acc, item) => {
        if (Array.isArray(item)) {
          if (item.length <= 0) {
            return acc
          }
          const subItems = FunctionParams.#orderItems(item) as FunctionParamsAST[]
          const objectItem = FunctionParams.toObject(subItems)

          return FunctionParams.#addParams(acc, objectItem)
        }

        return FunctionParams.#addParams(acc, item)
      }, [] as string[])
      .join(', ')
  }

  toString(): string {
    const items = FunctionParams.#orderItems(this.#items)

    return FunctionParams.toString(items)
  }
}
