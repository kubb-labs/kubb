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
  default?: string
  children?: Params
}

type ParamItem =
  | (Pick<Param, 'mode' | 'type'> & {
      optional?: true
      default?: never
      children?: Params
    })
  | (Pick<Param, 'mode' | 'type'> & {
      optional?: false
      default?: string
      children?: Params
    })

export type Params = Record<string, Param | undefined>

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

function parseChild(key: string, item: ParamItem): string[] {
  const entries = order(Object.entries(item.children as ParamItem))

  const types: string[] = []
  const names: string[] = []

  const optional = entries.every(([_key, item]) => item?.optional)

  entries.forEach(([key, item]) => {
    names.push(...parseItem(camelCase(key), { ...item, type: undefined }))
    if (entries.some(([_key, item]) => item?.type)) {
      types.push(...parseItem(camelCase(key), { ...item, default: undefined }))
    }
  })

  return parseItem(item.mode === 'inline' ? key : `{ ${names.join(', ')} }`, {
    type: item.type ? item.type : types.length ? `{ ${types.join('; ')} }` : undefined,
    default: item.default ? item.default : undefined,
    optional: !item.default ? optional : undefined,
  } as ParamItem)
}

function parseItem(name: string, item: ParamItem): string[] {
  const acc = []

  if (item.type) {
    if (item.optional) {
      acc.push(`${name}?: ${item.type}`)
    } else {
      acc.push(`${name}: ${item.type}${item.default ? ` = ${item.default}` : ''}`)
    }
  } else {
    acc.push(`${name}${item.default ? ` = ${item.default}` : ''}`)
  }

  return acc
}

export function getParams(items: Params): string {
  const entries = order(Object.entries(items as Record<string, ParamItem | undefined>))

  return entries
    .reduce((acc, [key, item]) => {
      if (!item) {
        return acc
      }

      if (item.children) {
        if (item.mode === 'inlineSpread') {
          return [...acc, getParams(item.children!)]
        }

        const parsedItem = parseChild(key, item)

        return [...acc, ...parsedItem]
      }

      const parsedItem = parseItem(camelCase(key), item)

      return [...acc, ...parsedItem]
    }, [] as string[])
    .join(', ')
}

export function isParamItems(items: any): items is Params {
  return typeof items !== 'string' && items && Object.keys(items)?.length
}
