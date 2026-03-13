import type { SchemaNode } from '@kubb/ast/types'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { SchemaObject } from '@kubb/oas'

/**
 * @deprecated replaced with SchemaNode
 */
export type SchemaKeywordMapper = {
  object: {
    keyword: 'object'
    args: {
      properties: { [x: string]: Schema[] }
      additionalProperties: Schema[]
      patternProperties?: Record<string, Schema[]>
      strict?: boolean
    }
  }
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
  tuple: { keyword: 'tuple'; args: { items: Schema[]; min?: number; max?: number; rest?: Schema } }
  array: {
    keyword: 'array'
    args: { items: Schema[]; min?: number; max?: number; unique?: boolean }
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
    args: {
      name: string
      $ref: string
      /**
       * Full qualified path.
       */
      path: KubbFile.Path
      /**
       * When true `File.Import` is used.
       * When false a reference is used inside the current file.
       */
      isImportable: boolean
    }
  }
  matches: { keyword: 'matches'; args?: string }
  boolean: { keyword: 'boolean' }
  default: { keyword: 'default'; args: string | number | boolean }
  string: { keyword: 'string' }
  integer: { keyword: 'integer' }
  bigint: { keyword: 'bigint' }
  number: { keyword: 'number' }
  max: { keyword: 'max'; args: number }
  min: { keyword: 'min'; args: number }
  exclusiveMaximum: { keyword: 'exclusiveMaximum'; args: number }
  exclusiveMinimum: { keyword: 'exclusiveMinimum'; args: number }
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
  void: { keyword: 'void' }
  blob: { keyword: 'blob' }
  schema: { keyword: 'schema'; args: { type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object'; format?: string } }
  name: { keyword: 'name'; args: string }
  catchall: { keyword: 'catchall' }
  interface: { keyword: 'interface' }
}
/**
 * @deprecated replaced with SchemaNode
 */
export const schemaKeywords = {
  any: 'any',
  unknown: 'unknown',
  number: 'number',
  integer: 'integer',
  bigint: 'bigint',
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
  void: 'void',
  /* intersection */
  default: 'default',
  const: 'const',
  and: 'and',
  describe: 'describe',
  min: 'min',
  max: 'max',
  exclusiveMinimum: 'exclusiveMinimum',
  exclusiveMaximum: 'exclusiveMaximum',
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
  interface: 'interface',
} satisfies {
  [K in keyof SchemaKeywordMapper]: SchemaKeywordMapper[K]['keyword']
}
/**
 * @deprecated replaced with SchemaNode
 */
export type SchemaKeyword = keyof SchemaKeywordMapper
/**
 * @deprecated replaced with SchemaNode
 */
export type SchemaMapper<T = string | null | undefined> = {
  [K in keyof SchemaKeywordMapper]: (() => T | undefined) | undefined
}
/**
 * @deprecated replaced with SchemaNode
 */
export type SchemaKeywordBase<T> = {
  keyword: SchemaKeyword
  args: T
}
/**
 * @deprecated replaced with SchemaNode
 */
export type Schema = { keyword: string } | SchemaKeywordMapper[keyof SchemaKeywordMapper]

export type SchemaTree = {
  /**
   * The spec-agnostic AST node produced by `convertSchema` for this schema.
   * Set to the top-level AST node at the root parse call; propagated as-is to all recursive sub-node calls.
   */
  schemaNode?: SchemaNode
  /**
   * @deprecated
   */
  schema: SchemaObject
  /**
   * @deprecated
   */
  parent: Schema | undefined
  /**
   * @deprecated
   */
  current: Schema
  /**
   * @deprecated
   */
  siblings: Schema[]
  /**
   * this is equal to the key of a property(object)
   * @deprecated
   */
  name?: string
}
/**
 * @deprecated replaced with SchemaNode
 */
export function isKeyword<T extends Schema, K extends keyof SchemaKeywordMapper>(meta: T, keyword: K): meta is Extract<T, SchemaKeywordMapper[K]> {
  return meta.keyword === keyword
}
