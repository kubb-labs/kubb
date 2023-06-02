import { KeywordZodNodes, keywordZodNodes } from '../utils/keywordZodNodes'

type ZodMetaBase<T> = {
  keyword: KeywordZodNodes
  args: T
}

type ZodMetaAny = { keyword: typeof keywordZodNodes.any }
type ZodMetaNull = { keyword: typeof keywordZodNodes.null }
type ZodMetaUndefined = { keyword: typeof keywordZodNodes.undefined }

type ZodMetaNumber = { keyword: typeof keywordZodNodes.number }

type ZodMetaString = { keyword: typeof keywordZodNodes.string }

type ZodMetaBoolean = { keyword: typeof keywordZodNodes.boolean }

type ZodMetaDescribe = { keyword: typeof keywordZodNodes.describe; args?: string }
type ZodMetaMin = { keyword: typeof keywordZodNodes.min; args?: number }

type ZodMetaMax = { keyword: typeof keywordZodNodes.max; args?: number }
type ZodMetaMatches = { keyword: typeof keywordZodNodes.matches; args?: string }
type ZodMetaOptional = { keyword: typeof keywordZodNodes.optional }

type ZodMetaObject = { keyword: typeof keywordZodNodes.object; args?: { [x: string]: ZodMeta[] } }

type ZodMetaCatchall = { keyword: typeof keywordZodNodes.catchall; args?: ZodMeta[] }

type ZodMetaRef = { keyword: typeof keywordZodNodes.ref; args?: string }

type ZodMetaUnion = { keyword: typeof keywordZodNodes.union; args?: ZodMeta[] }

type ZodMetaAnd = { keyword: typeof keywordZodNodes.and; args?: ZodMeta[] }

type ZodMetaEnum = { keyword: typeof keywordZodNodes.enum; args?: Array<string | number> }

type ZodMetaArray = { keyword: typeof keywordZodNodes.array; args?: ZodMeta[] }

type ZodMetaTuple = { keyword: typeof keywordZodNodes.tuple; args?: ZodMeta[] }
type ZodMetaLazy = { keyword: typeof keywordZodNodes.lazy }

export type ZodMeta =
  | ZodMetaAny
  | ZodMetaNull
  | ZodMetaUndefined
  | ZodMetaNumber
  | ZodMetaString
  | ZodMetaBoolean
  | ZodMetaLazy
  | ZodMetaDescribe
  | ZodMetaMin
  | ZodMetaMax
  | ZodMetaMatches
  | ZodMetaOptional
  | ZodMetaObject
  | ZodMetaCatchall
  | ZodMetaRef
  | ZodMetaUnion
  | ZodMetaAnd
  | ZodMetaEnum
  | ZodMetaArray
  | ZodMetaTuple

/**
 *
 * @link based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398
 */

function zodKeywordMapper(a: ZodMeta, b: ZodMeta) {
  if (b.keyword === keywordZodNodes.null) {
    return -1
  }

  return 0
}

function parseZodMeta(item: ZodMeta): string {
  // TODO move to separate file + add better typing
  // eslint-disable-next-line prefer-const
  let { keyword, args = '' } = (item || {}) as ZodMetaBase<any>

  if (keyword === keywordZodNodes.tuple) {
    return `${keyword}(${Array.isArray(args) ? `[${args.map(parseZodMeta).join(',')}]` : parseZodMeta(args)})`
  }

  if (keyword === keywordZodNodes.array) {
    return `${keyword}(${Array.isArray(args) ? `${args.map(parseZodMeta).join('')}` : parseZodMeta(args)})`
  }
  if (keyword === keywordZodNodes.union) {
    return `${keywordZodNodes.and}(${Array.isArray(args) ? `${keyword}([${args.map(parseZodMeta).join(',')}])` : parseZodMeta(args)})`
  }

  if (keyword === keywordZodNodes.catchall) {
    return `${keyword}(${Array.isArray(args) ? `${args.map(parseZodMeta).join('')}` : parseZodMeta(args)})`
  }

  if (keyword === keywordZodNodes.and)
    return Array.isArray(args)
      ? `${args
          .map(parseZodMeta)
          .map((item) => `${keyword}(${item})`)
          .join('')}`
      : `${keyword}(${parseZodMeta(args)})`

  if (keyword === keywordZodNodes.object) {
    if (!args) {
      args = '{}'
    }
    const argsObject = Object.entries(args)
      .filter((item) => {
        const schema = item[1] as ZodMeta[]
        return schema && typeof schema.map === 'function'
      })
      .map((item) => {
        const key = item[0] as string
        const schema = item[1] as ZodMeta[]
        return `"${key}": ${schema.sort(zodKeywordMapper).map(parseZodMeta).join('')}`
      })
      .join(',')

    args = `{${argsObject}}`
  }

  // custom type
  if (keyword === keywordZodNodes.ref) {
    // use of z.lazy because we need to import from files x or we use the type as a self referene
    return `${keywordZodNodes.lazy}(() => ${args})`
  }

  return `${keyword}(${args})`
}

export function parseZod(items: ZodMeta[]): string {
  if (!items.length) {
    return ''
  }

  return items.map(parseZodMeta).join('')
}
