import { sortBy } from 'remeda'

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
  type: 'constructor' | 'call' | 'object' | 'objectValue'
  transformName?: (name: string) => string
  transformType?: (type: string) => string
}

function order(items: Array<[key: string, item?: ParamItem]>) {
  return sortBy(items.filter(Boolean) as Array<[key: string, item?: ParamItem]>, ([_key, item]) => {
    if (item?.children) {
      return 0 // Treat items with children as required (they'll get = {} if all children are optional)
    }
    // Priority order: required (0) → optional (1) → default-only (2)
    if (item?.optional) {
      return 1 // Optional parameters (with or without default)
    }
    if (item?.default) {
      // Parameters with default only (not marked as optional)
      // Note: While the ParamItem type suggests optional and default are mutually exclusive,
      // this handles the case where a parameter has a default value but isn't explicitly marked as optional
      return 2
    }
    return 0 // Required parameters
  })
}

function parseChild(key: string, item: ParamItem, options: Options): string | null {
  // @ts-expect-error
  const entries = order(Object.entries(item.children))

  const types: string[] = []
  const names: string[] = []

  const optional = entries.every(([_key, item]) => item?.optional || !!item?.default)

  entries.forEach(([key, entryItem]) => {
    if (entryItem) {
      const name = parseItem(key, { ...entryItem, type: undefined }, options)
      if (entryItem.children) {
        const subTypes = Object.entries(entryItem.children)
          .map(([key]) => {
            return key
          })
          .join(', ')

        if (subTypes) {
          names.push(`${name}: { ${subTypes} }`)
        } else {
          names.push(name)
        }
      } else {
        if (options.type === 'call' && options.transformName) {
          names.push(`${key}: ${name}`)
        } else {
          names.push(name)
        }
      }

      if (entries.some(([_key, item]) => item?.type)) {
        types.push(parseItem(key, { ...entryItem, default: undefined }, options))
      }
    }
  })

  const name = item.mode === 'inline' ? key : names.length ? `{ ${names.join(', ')} }` : undefined
  const type = item.type ? item.type : types.length ? `{ ${types.join('; ')} }` : undefined

  if (!name) {
    return null
  }

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

function parseItem(name: string, item: ParamItem, options: Options): string {
  const acc: string[] = []
  const transformedName = options.transformName ? options.transformName(name) : name
  const transformedType = options.transformType && item.type ? options.transformType(item.type) : item.type

  if (options.type === 'object') {
    return transformedName
  }

  if (options.type === 'objectValue') {
    return item.value ? `${transformedName}: ${item.value}` : transformedName
  }

  //LEGACY
  if (item.type && options.type === 'constructor') {
    if (item.optional) {
      // Check if this is a destructured parameter (object mode)
      const isDestructured = transformedName.startsWith('{')
      if (isDestructured) {
        // For destructured parameters, use ": type = {}" syntax to make it optional
        acc.push(`${transformedName}: ${transformedType} = {}`)
      } else {
        // For inline parameters, use "?: type" syntax
        acc.push(`${transformedName}?: ${transformedType}`)
      }
    } else {
      acc.push(`${transformedName}: ${transformedType}${item.default ? ` = ${item.default}` : ''}`)
    }
  } else if (item.default && options.type === 'constructor') {
    acc.push(`${transformedName} = ${item.default}`)
  } else if (item.value) {
    acc.push(`${transformedName} : ${item.value}`)
  } else if (item.mode === 'inlineSpread') {
    acc.push(`... ${transformedName}`)
  } else {
    acc.push(transformedName)
  }

  return acc[0] as string
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
          return [...acc, getFunctionParams(item.children, options)]
        }

        const parsedItem = parseChild(key, item, options)
        if (!parsedItem) {
          return acc
        }

        return [...acc, parsedItem]
      }

      const parsedItem = parseItem(key, item, options)

      return [...acc, parsedItem]
    }, [] as string[])
    .join(', ')
}

/**
 * @deprecated use @kubb/ast
 */
export function createFunctionParams(params: Params): Params {
  return params
}

/**
 * @deprecated use @kubb/ast
 */
export class FunctionParams {
  #params: Params

  static factory(params: Params) {
    return new FunctionParams(params)
  }
  constructor(params: Params) {
    this.#params = params
  }

  get params(): Params {
    return this.#params
  }

  get flatParams(): Params {
    const flatter = (acc: Params, [key, item]: [key: string, item?: Param]): Params => {
      if (item?.children) {
        return Object.entries(item.children).reduce(flatter, acc)
      }
      if (item) {
        acc[key] = item
      }

      return acc
    }
    return Object.entries(this.#params).reduce(flatter, {} as Params)
  }

  toCall({ transformName, transformType }: Pick<Options, 'transformName' | 'transformType'> = {}): string {
    return getFunctionParams(this.#params, { type: 'call', transformName, transformType })
  }

  toObject(): string {
    return getFunctionParams(this.#params, { type: 'object' })
  }
  toObjectValue(): string {
    return getFunctionParams(this.#params, { type: 'objectValue' })
  }

  toConstructor(): string {
    return getFunctionParams(this.#params, { type: 'constructor' })
  }
}
