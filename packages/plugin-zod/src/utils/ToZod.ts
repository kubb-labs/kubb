import type { ZodArray, ZodDefault, ZodEffects, ZodNullable, ZodOptional, ZodType } from 'zod'

type IsNullable<T> = Extract<T, null> extends never ? false : true
type IsOptional<T> = Extract<T, undefined> extends never ? false : true

type ZodWithEffects<T> = T | ZodType<T> | ZodDefault<T extends ZodType ? T : ZodType<T>> | ZodEffects<T extends ZodType ? T : ZodType<T>, any, any>

export type ToZod<T> = T extends any[]
  ? ZodArray<ToZod<T[number]>>
  : T extends Record<string, any> // object
    ? {
        [K in keyof T]-?: T[K] extends any[] ? ZodArray<ToZod<T[K][number]>> : ToZodSchemaPrimitive<T[K]>
      }
    : ZodWithEffects<T>

type ToZodSchemaPrimitive<T> = IsNullable<T> extends true
  ? IsOptional<T> extends true
    ?
        | ZodWithEffects<ZodNullable<ZodOptional<ZodType<Exclude<Exclude<T, null>, undefined>>>>>
        | ZodWithEffects<ZodOptional<ZodNullable<ZodType<Exclude<Exclude<T, null>, undefined>>>>>
    : ZodWithEffects<ZodNullable<ZodType<Exclude<T, null>>>>
  : IsOptional<T> extends true
    ? ZodWithEffects<ZodOptional<ZodType<Exclude<T, undefined>>>> | ZodWithEffects<ZodDefault<ZodType<Exclude<T, undefined>>>>
    : ZodWithEffects<T>

// type isAny<T> = [any extends T ? 'true' : 'false'] extends ['true'] ? true : false
// type nonoptional<T> = T extends undefined ? never : T
// type nonnullable<T> = T extends null ? never : T
// type equals<X, Y> = [X] extends [Y] ? ([Y] extends [X] ? true : false) : false
//
// /**
//  * See https://github.com/colinhacks/tozod/blob/master/src/index.ts
//  * Adapted based on https://github.com/colinhacks/zod/issues/372
//  */
// export type toZod<T> = {
//   any: z.ZodAny
//   optional: z.ZodUnion<[toZod<nonoptional<T>>, z.ZodUndefined]>
//   nullable: z.ZodUnion<[toZod<nonnullable<T>>, z.ZodNull]>
//   array: T extends Array<infer U> ? z.ZodArray<toZod<U>> : never
//   string: z.ZodString
//   bigint: z.ZodBigInt
//   number: z.ZodNumber
//   boolean: z.ZodBoolean
//   date: z.ZodDate
//   object: z.ZodObject<{ [k in keyof T]: toZod<T[k]> }, 'strict', Extract<T, z.ZodTypeAny>>
//   rest: never
// }[zodKey<T>]
//
// type zodKey<T> = isAny<T> extends true
//   ? 'any'
//   : equals<T, boolean> extends true //[T] extends [booleanUtil.Type]
//     ? 'boolean'
//     : [undefined] extends [T]
//       ? 'optional'
//       : [null] extends [T]
//         ? 'nullable'
//         : T extends any[]
//           ? 'array'
//           : equals<T, string> extends true
//             ? 'string'
//             : equals<T, bigint> extends true //[T] extends [bigintUtil.Type]
//               ? 'bigint'
//               : equals<T, number> extends true //[T] extends [numberUtil.Type]
//                 ? 'number'
//                 : equals<T, Date> extends true //[T] extends [dateUtil.Type]
//                   ? 'date'
//                   : T extends { [k: string]: any } //[T] extends [structUtil.Type]
//                     ? 'object'
//                     : 'rest'
