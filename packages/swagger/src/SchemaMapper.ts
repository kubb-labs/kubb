import type { KubbFile } from '@kubb/core'

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
  uuid: { keyword: 'uuid' }
  email: { keyword: 'email' }
  firstName: { keyword: 'firstName' }
  lastName: { keyword: 'lastName' }
  phone: { keyword: 'phone' }
  password: { keyword: 'password' }
  date: { keyword: 'date' }
  datetime: { keyword: 'datetime' }
  tuple: { keyword: 'tuple'; args: Schema[] }
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
        format: 'string' | 'number'
        value?: string | number
      }>
    }
  }
  and: { keyword: 'and'; args: Schema[] }
  const: {
    keyword: 'const'
    args: {
      name: string | number
      format: 'string' | 'number'
      value?: string | number
    }
  }
  union: { keyword: 'union'; args: Schema[] }
  ref: {
    keyword: 'ref'
    args: { name: string; path: KubbFile.OptionalPath; isTypeOnly?: boolean }
  }
  lazy: { keyword: 'lazy' }
  matches: { keyword: 'matches'; args?: string }
  boolean: { keyword: 'boolean' }
  default: { keyword: 'default'; args: string | number | boolean }
  string: { keyword: 'string'; args?: { min?: number; max?: number } }
  integer: { keyword: 'integer'; args?: { min?: number; max?: number } }
  number: { keyword: 'number'; args?: { min?: number; max?: number } }
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
  type: {
    keyword: 'type'
    args: string
  }
  format: { keyword: 'format'; args: string }
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
  lazy: 'lazy',
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
  type: 'type',
  format: 'format',
  catchall: 'catchall',
} satisfies {
  [K in keyof SchemaKeywordMapper]: SchemaKeywordMapper[K]['keyword']
}

export type SchemaKeyword = keyof SchemaKeywordMapper

export type SchemaMapper<T = string> = {
  [K in keyof SchemaKeywordMapper]: T | undefined
}

export type SchemaKeywordBase<T> = {
  keyword: SchemaKeyword
  args: T
}

export type Schema = { keyword: string } | SchemaKeywordMapper[keyof SchemaKeywordMapper]

export function isKeyword<T extends Schema, K extends keyof SchemaKeywordMapper>(meta: T, keyword: K): meta is Extract<T, SchemaKeywordMapper[K]> {
  return meta.keyword === keyword
}
