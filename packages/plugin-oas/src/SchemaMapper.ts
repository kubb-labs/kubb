import type * as KubbFile from '@kubb/fs/types'

export type SchemaKeywordMapper = {
  object: {
    keyword: 'object'
    args: {
      properties: { [x: string]: Schema[] }
      additionalProperties: Schema[]
      strict?: boolean
    }
  }
  strict: { keyword: 'strict' }
  url: { keyword: 'url' }
  readOnly: { keyword: 'readOnly' }
  writeOnly: { keyword: 'writeOnly' }
  uuid: { keyword: 'uuid' }
  email: { keyword: 'email' }
  firstName: { keyword: 'firstName' }
  lastName: { keyword: 'lastName' }
  phone: { keyword: 'phone' }
  password: { keyword: 'password' }
  date: { keyword: 'date'; args: { type?: 'date' | 'string' } }
  time: { keyword: 'time'; args: { type?: 'date' | 'string' } }
  datetime: { keyword: 'datetime'; args: { offset?: boolean; local?: boolean } }
  tuple: { keyword: 'tuple'; args: { items: Schema[]; min?: number; max?: number } }
  array: {
    keyword: 'array'
    args: { items: Schema[]; min?: number; max?: number }
  }
  enum: {
    keyword: 'enum'
    args: {
      name: string
      typeName: string
      asConst: boolean
      items: Array<{
        name: string | number
        format: 'string' | 'number' | 'boolean'
        value?: string | number | boolean
      }>
    }
  }
  and: { keyword: 'and'; args: Schema[] }
  const: {
    keyword: 'const'
    args: {
      name: string | number
      format: 'string' | 'number' | 'boolean'
      value?: string | number | boolean
    }
  }
  union: { keyword: 'union'; args: Schema[] }
  ref: {
    keyword: 'ref'
    args: { name: string; path: KubbFile.OptionalPath }
  }
  matches: { keyword: 'matches'; args?: string }
  boolean: { keyword: 'boolean' }
  default: { keyword: 'default'; args: string | number | boolean }
  string: { keyword: 'string' }
  integer: { keyword: 'integer' }
  number: { keyword: 'number' }
  max: { keyword: 'max'; args: number }
  min: { keyword: 'min'; args: number }
  describe: { keyword: 'describe'; args: string }
  example: { keyword: 'example'; args: string }
  deprecated: { keyword: 'deprecated' }
  optional: { keyword: 'optional' }
  undefined: { keyword: 'undefined' }
  nullish: { keyword: 'nullish' }
  nullable: { keyword: 'nullable' }
  null: { keyword: 'null' }
  any: { keyword: 'any' }
  unknown: { keyword: 'unknown' }
  blob: { keyword: 'blob' }
  schema: { keyword: 'schema'; args: { type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object'; format?: string } }
  name: { keyword: 'name'; args: string }
  catchall: { keyword: 'catchall' }
}

export const schemaKeywords = {
  any: 'any',
  strict: 'strict',
  unknown: 'unknown',
  number: 'number',
  integer: 'integer',
  string: 'string',
  boolean: 'boolean',
  undefined: 'undefined',
  nullable: 'nullable',
  null: 'null',
  nullish: 'nullish',
  array: 'array',
  tuple: 'tuple',
  enum: 'enum',
  union: 'union',
  datetime: 'datetime',
  date: 'date',
  email: 'email',
  uuid: 'uuid',
  url: 'url',
  /* intersection */
  default: 'default',
  const: 'const',
  and: 'and',
  describe: 'describe',
  min: 'min',
  max: 'max',
  optional: 'optional',
  readOnly: 'readOnly',
  writeOnly: 'writeOnly',

  // custom ones
  object: 'object',
  ref: 'ref',
  matches: 'matches',
  firstName: 'firstName',
  lastName: 'lastName',
  password: 'password',
  phone: 'phone',
  blob: 'blob',
  deprecated: 'deprecated',
  example: 'example',
  schema: 'schema',
  catchall: 'catchall',
  time: 'time',
  name: 'name',
} satisfies {
  [K in keyof SchemaKeywordMapper]: SchemaKeywordMapper[K]['keyword']
}

export type SchemaKeyword = keyof SchemaKeywordMapper

export type SchemaMapper<T = string | null | undefined> = {
  [K in keyof SchemaKeywordMapper]: (() => T | undefined) | undefined
}

export type SchemaKeywordBase<T> = {
  keyword: SchemaKeyword
  args: T
}

export type Schema = { keyword: string } | SchemaKeywordMapper[keyof SchemaKeywordMapper]

export function isKeyword<T extends Schema, K extends keyof SchemaKeywordMapper>(meta: T, keyword: K): meta is Extract<T, SchemaKeywordMapper[K]> {
  return meta.keyword === keyword
}
