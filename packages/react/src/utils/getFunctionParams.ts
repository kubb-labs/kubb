import { camelCase } from '@kubb/core/transformers'
import { orderBy } from 'natural-orderby'

export type Param = {
  /**
   * `object` will return the pathParams as an object.
   *
   * `inline` will return the pathParams as comma separated params.
   * @default `'inline'`
   * @private
   */
  mode?: 'object' | 'inline' | 'inlineSpread'
  type?: 'string' | 'number' | (string & {})
  optional?: boolean
  /**
   * @example test = "default"
   */
  default?: string
  /**
   * Used for no TypeScript(with mode object)
   * @example test: "default"
   */
  value?: string
  children?: Params
}

type ParamItem =
  | (Pick<Param, 'mode' | 'type' | 'value'> & {
      optional?: true
      default?: never
      children?: Params
    })
  | (Pick<Param, 'mode' | 'type' | 'value'> & {
      optional?: false
      default?: string
      children?: Params
    })

export type Params = Record<string, Param | undefined>

type Options = {
  type: 'constructor' | 'call' | 'generics'
}

function order(items: Array<[key: string, item?: ParamItem]>) {
  return orderBy(
    items.filter(Boolean),
    [
      ([_key, item]) => {
        if (item?.children) {
          return undefined
        }
        return !item?.default
      },
      ([_key, item]) => {
        if (item?.children) {
          return undefined
        }
        return !item?.optional
      },
    ],
    ['desc', 'desc'],
  )
}

function parseChild(key: string, item: ParamItem, options: Options): string[] {
  const entries = order(Object.entries(item.children as ParamItem))

  const types: string[] = []
  const names: string[] = []

  const optional = entries.every(([_key, item]) => item?.optional)

  entries.forEach(([key, entryItem]) => {
    if (entryItem) {
      names.push(...parseItem(key, { ...entryItem, type: undefined }, options))

      if (entries.some(([_key, item]) => item?.type)) {
        types.push(...parseItem(key, { ...entryItem, default: undefined }, options))
      }
    }
  })

  const name = item.mode === 'inline' ? key : names.length ? `{ ${names.join(', ')} }` : ''
  const type = item.type ? item.type : types.length ? `{ ${types.join('; ')} }` : undefined

  return parseItem(
    name,
    {
      type,
      default: item.default,
      optional: !item.default ? optional : undefined,
    } as ParamItem,
    options,
  )
}

function parseItem(name: string, item: ParamItem, options: Options): string[] {
  const acc = []

  if (item.type && options.type === 'constructor') {
    if (item.optional) {
      acc.push(`${name}?: ${item.type}`)
    } else {
      acc.push(`${name}: ${item.type}${item.default ? ` = ${item.default}` : ''}`)
    }
  } else if (item.default && options.type === 'constructor') {
    acc.push(`${name} = ${item.default}`)
  } else if (item.value) {
    acc.push(`${name} : ${item.value}`)
  } else if (item.mode === 'inlineSpread') {
    acc.push(`... ${name}`)
  } else {
    acc.push(name)
  }

  return acc
}

export function getFunctionParams(params: Params, options: Options): string {
  const entries = order(Object.entries(params as Record<string, ParamItem | undefined>))

  return entries
    .reduce((acc, [key, item]) => {
      if (!item) {
        return acc
      }

      if (item.children) {
        if (Object.keys(item.children).length === 0) {
          return acc
        }

        if (item.mode === 'inlineSpread') {
          return [...acc, getFunctionParams(item.children!, options)]
        }

        const parsedItem = parseChild(key, item, options)

        return [...acc, ...parsedItem]
      }

      const parsedItem = parseItem(camelCase(key), item, options)

      return [...acc, ...parsedItem]
    }, [] as string[])
    .join(', ')
}

export function createFunctionParams(params: Params): Params {
  return params
}

export class FunctionParams {
  #params: Params

  static factory(params: Params) {
    return new FunctionParams(params)
  }
  constructor(params: Params) {
    this.#params = params
  }

  get params() {
    return this.#params
  }

  toCall(): string {
    return getFunctionParams(this.#params, { type: 'call' })
  }

  toConstructor({ valueAsType }: { valueAsType: boolean } = { valueAsType: false }): string {
    if (valueAsType) {
      Object.entries(this.#params).reduce((acc, [key, item]) => {
        if (item) {
          acc[key] = {
            ...item,
            value: item?.type,
            type: undefined,
          }
        }

        return acc
      }, {} as Params)

      return getFunctionParams(this.#params, { type: 'constructor' })
    }
    return getFunctionParams(this.#params, { type: 'constructor' })
  }
}

export function isFunctionParams(items: any): items is Params {
  return typeof items !== 'string' && items && Object.keys(items)?.length
}
