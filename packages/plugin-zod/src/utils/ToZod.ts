/**
 * See https://github.com/colinhacks/tozod/blob/master/src/index.ts
 * Adapted based on https://github.com/colinhacks/zod/issues/372
 */

import type { z } from 'zod'

type isAny<T> = [any extends T ? 'true' : 'false'] extends ['true'] ? true : false
type nonoptional<T> = T extends undefined ? never : T
type nonnullable<T> = T extends null ? never : T
type equals<X, Y> = [X] extends [Y] ? ([Y] extends [X] ? true : false) : false

type zodKey<T> = isAny<T> extends true
  ? 'any'
  : equals<T, boolean> extends true //[T] extends [booleanUtil.Type]
    ? 'boolean'
    : [undefined] extends [T]
      ? 'optional'
      : [null] extends [T]
        ? 'nullable'
        : T extends any[]
          ? 'array'
          : equals<T, string> extends true
            ? 'string'
            : equals<T, bigint> extends true //[T] extends [bigintUtil.Type]
              ? 'bigint'
              : equals<T, number> extends true //[T] extends [numberUtil.Type]
                ? 'number'
                : equals<T, Date> extends true //[T] extends [dateUtil.Type]
                  ? 'date'
                  : T extends { [k: string]: any } //[T] extends [structUtil.Type]
                    ? 'object'
                    : 'rest'

export type ToZod<T> = {
  any: z.ZodAny
  optional: z.ZodOptional<ToZod<nonoptional<T>>>
  nullable: z.ZodNullable<ToZod<nonnullable<T>>>
  array: T extends Array<infer U> ? z.ZodArray<ToZod<U>> : never
  string: z.ZodString
  bigint: z.ZodBigInt
  number: z.ZodNumber
  boolean: z.ZodBoolean
  date: z.ZodDate

  object: z.ZodObject<
    // @ts-expect-error cannot convert without Extract but Extract removes the type
    {
      [K in keyof T]: T[K]
    },
    'passthrough',
    z.ZodTypeAny,
    T
  >
  rest: z.ZodType<T>
}[zodKey<T>]

export type ZodShape<T> = {
  // Require all the keys from T
  [key in keyof T]-?: ToZod<T[key]>
}
