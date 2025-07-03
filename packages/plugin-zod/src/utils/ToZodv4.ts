import type { z } from 'zod/v4'

/**
 * See https://github.com/colinhacks/tozod/blob/master/src/index.ts
 * Adapted based on https://github.com/colinhacks/zod/issues/372
 */

type isAny<T> = [any extends T ? 'true' : 'false'] extends ['true'] ? true : false
type nonoptional<T> = T extends undefined ? never : T
type nonnullable<T> = T extends null ? never : T
type equals<X, Y> = [X] extends [Y] ? ([Y] extends [X] ? true : false) : false

type zodKey<T> = isAny<T> extends true
  ? 'any'
  : equals<T, boolean> extends true
    ? 'boolean'
    : [undefined] extends [T]
      ? 'optional'
      : [null] extends [T]
        ? 'nullable'
        : T extends any[]
          ? 'array'
          : equals<T, string> extends true
            ? 'string'
            : equals<T, bigint> extends true
              ? 'bigint'
              : equals<T, number> extends true
                ? 'number'
                : equals<T, Date> extends true
                  ? 'date'
                  : T extends { [k: string]: any }
                    ? 'object'
                    : 'rest'

type ToZodV4<T> = {
  any: z.ZodAny
  // @ts-ignore
  optional: z.ZodOptional<ToZodV4<nonoptional<T>>>
  // @ts-ignore
  nullable: z.ZodNullable<ToZodV4<nonnullable<T>>>
  // @ts-ignore
  array: T extends Array<infer U> ? z.ZodArray<ToZodV4<U>> : never
  string: z.ZodString
  bigint: z.ZodBigInt
  number: z.ZodNumber
  boolean: z.ZodBoolean
  date: z.ZodDate
  // @ts-ignore
  object: z.ZodObject<ZodV4Shape<T>, 'passthrough'>
  rest: z.ZodType<T>
}[zodKey<T>]

type ZodV4Shape<T> = {
  [key in keyof T]-?: ToZodV4<T[key]>
}

export type { ToZodV4, ZodV4Shape }
