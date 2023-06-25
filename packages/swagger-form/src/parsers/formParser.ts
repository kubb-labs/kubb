import { renderTemplate } from '../../../core/src/utils/renderTemplate'
export const formKeywords = {
  any: 'any',
  number: 'number',
  integer: 'integer',
  object: 'object',
  lazy: 'lazy',
  string: 'string',
  boolean: 'boolean',
  undefined: 'undefined',
  null: 'null',
  array: 'array',
  tuple: 'tuple',
  enum: 'enum',
  union: 'union',
  datetime: 'datetime',
  email: 'email',
  uuid: 'uuid',
  url: 'url',
  /* intersection */
  default: 'default',
  and: 'and',
  min: 'min',
  max: 'max',
  required: 'required',
  catchall: 'catchall',

  // custom ones
  ref: 'ref',
  matches: 'matches',
} as const

export type FormKeyword = keyof typeof formKeywords

export const formKeywordMapper: Record<FormKeyword, string> = {
  any: 'z.any',
  number: 'z.number',
  integer: 'z.number',
  object: 'z.object',
  lazy: 'z.lazy',
  string: `
  <label>{{name}}</label>
  <input {...register('{{name}}', { required: {{required}} })} defaultValue={{defaultValue}} />
  `,
  boolean: 'z.boolean',
  undefined: 'z.undefined',
  null: 'z.null',
  array: 'z.array',
  tuple: 'z.tuple',
  enum: 'z.enum',
  union: 'z.union',
  datetime: '.datetime',
  email: '.email',
  uuid: '.uuid',
  url: '.url',
  /* intersection */
  default: '.default',
  and: '.and',
  min: '.min',
  max: '.max',
  required: ` {errors['{{name}}'] && <p>This field is required</p>}`,
  catchall: '.catchall',

  // custom ones
  ref: 'ref',
  matches: '.regex',
} as const

type FormMetaBase<T> = {
  keyword: FormKeyword
  args: T
}

type FormMetaAny = { keyword: typeof formKeywords.any }
type FormMetaUndefined = {
  keyword: typeof formKeywords.undefined
  args: { name?: string; fullName?: string; required?: boolean; defaultValue?: string | number | boolean }
}
type FormMetaNull = {
  keyword: typeof formKeywords.null
  args: { name?: string; fullName?: string; required?: boolean; defaultValue?: string | number | boolean }
}
type FormMetaNumber = {
  keyword: typeof formKeywords.number
  args: { name?: string; fullName?: string; required?: boolean; defaultValue?: string | number | boolean }
}
type FormMetaInteger = {
  keyword: typeof formKeywords.integer
  args: { name?: string; fullName?: string; required?: boolean; defaultValue?: string | number | boolean }
}

type FormMetaString = {
  keyword: typeof formKeywords.string
  args: { name?: string; fullName?: string; required?: boolean; defaultValue?: string | number | boolean }
}

type FormMetaBoolean = {
  keyword: typeof formKeywords.boolean
  args: { name?: string; fullName?: string; required?: boolean; defaultValue?: string | number | boolean }
}

type FormMetaMin = { keyword: typeof formKeywords.min; args?: number }

type FormMetaMax = { keyword: typeof formKeywords.max; args?: number }
type FormMetaMatches = { keyword: typeof formKeywords.matches; args?: string }
type FormMetaRequired = { keyword: typeof formKeywords.required }

type FormMetaObject = { keyword: typeof formKeywords.object; args?: { [x: string]: FormMeta[] } }

type FormMetaCatchall = { keyword: typeof formKeywords.catchall; args?: FormMeta[] }

type FormMetaRef = { keyword: typeof formKeywords.ref; args?: string }

type FormMetaUnion = { keyword: typeof formKeywords.union; args?: FormMeta[] }

type FormMetaAnd = { keyword: typeof formKeywords.and; args?: FormMeta[] }

type FormMetaEnum = { keyword: typeof formKeywords.enum; args?: Array<string | number> }

type FormMetaArray = { keyword: typeof formKeywords.array; args?: FormMeta[] }

type FormMetaTuple = { keyword: typeof formKeywords.tuple; args?: FormMeta[] }
type FormMetaLazy = { keyword: typeof formKeywords.lazy }
type FormMetaDefault = { keyword: typeof formKeywords.default; args?: string | number | boolean }

type FormMetaDatetime = { keyword: typeof formKeywords.datetime }

type FormMetaEmail = { keyword: typeof formKeywords.email }

type FormMetaUuid = { keyword: typeof formKeywords.uuid }

type FormMetaUrl = { keyword: typeof formKeywords.url }

export type FormMeta =
  | FormMetaAny
  | FormMetaUndefined
  | FormMetaNull
  | FormMetaInteger
  | FormMetaNumber
  | FormMetaString
  | FormMetaBoolean
  | FormMetaLazy
  | FormMetaMin
  | FormMetaMax
  | FormMetaMatches
  | FormMetaRequired
  | FormMetaObject
  | FormMetaCatchall
  | FormMetaRef
  | FormMetaUnion
  | FormMetaAnd
  | FormMetaEnum
  | FormMetaArray
  | FormMetaTuple
  | FormMetaDefault
  | FormMetaDatetime
  | FormMetaEmail
  | FormMetaUuid
  | FormMetaUrl

export function parseFormMeta(item: FormMeta, mapper: Record<FormKeyword, string> = formKeywordMapper): string {
  // eslint-disable-next-line prefer-const
  let { keyword, args = '' } = (item || {}) as FormMetaBase<unknown>
  const value = mapper[keyword]

  if (keyword === formKeywords.object) {
    if (!args) {
      args = '{}'
    }
    const argsObject = Object.entries(args as FormMeta)
      .filter((item) => {
        const schema = item[1] as FormMeta[]
        return schema && typeof schema.map === 'function'
      })
      .map((item) => {
        const name = item[0]
        const schema = item[1] as FormMeta[]

        const required = schema.some((item) => item.keyword === formKeywords.required)
        const defaultArgs = schema.find((item) => item.keyword === formKeywords.default) as FormMetaDefault | undefined

        return schema
          .map((item) => {
            if (item.keyword === formKeywords.string) {
              return {
                ...item,
                args: {
                  ...(item.args || {}),
                  required,
                  defaultValue: defaultArgs?.args,
                },
              }
            }
            return item
          })
          .map((item) => parseFormMeta(item, mapper))
          .join('')
      })
      .join('\n\n')

    return argsObject
  }

  // custom type
  if (keyword === formKeywords.ref) {
    // use of z.lazy because we need to import from files x or we use the type as a self reference
    return `${mapper.lazy}(() => ${args as string})`
  }

  if (keyword === formKeywords.string) {
    const { fullName, required, defaultValue = '""' } = args as FormMetaString['args']
    const template = [value, required ? renderTemplate(mapper[formKeywords.required], { name: fullName }) : undefined].filter(Boolean)

    return renderTemplate(template.join(''), { name: fullName, required, defaultValue })
  }

  // if (keyword in formKeywords && args) {
  //   return renderTemplate(value, args as Record<string, string>)
  // }

  return ''
}

export function formParser(items: FormMeta[], options: { mapper?: Record<FormKeyword, string> } = {}): string {
  if (!items.length) {
    return ''
  }

  return items.map((item) => parseFormMeta(item, options.mapper)).join('')
}
