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
                  : T extends { slice: any; stream: any; text: any }
                    ? 'blob'
                    : T extends { [key: string]: any }
                      ? 'object'
                      : 'rest'

type ToZod<T> = {
  any: z.ZodAny
  // @ts-expect-error Excessive stack depth comparing types
  optional: z.ZodOptional<ToZod<nonoptional<T>>>
  // @ts-expect-error Excessive stack depth comparing types
  nullable: z.ZodNullable<ToZod<nonnullable<T>>>
  // @ts-expect-error Excessive stack depth comparing types
  array: T extends Array<infer U> ? z.ZodArray<ToZod<U>> : never
  string: z.ZodString
  file: z.ZodFile
  blob: z.ZodType<Blob, T>
  bigint: z.ZodBigInt
  number: z.ZodNumber
  boolean: z.ZodBoolean
  date: z.ZodDate
  // @ts-expect-error Excessive stack depth comparing types
  object: z.ZodObject<ZodShape<T>, 'passthrough'>
  rest: z.ZodType<T>
}[zodKey<T>]

type ZodShape<T> = {
  [key in keyof T]-?: ToZod<T[key]>
}

export type { ToZod, ZodShape }
