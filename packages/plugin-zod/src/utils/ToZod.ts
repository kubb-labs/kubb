import type { ZodArray, ZodDefault, ZodEffects, ZodNullable, ZodOptional, ZodType } from 'zod'

type IsNullable<T> = Extract<T, null> extends never ? false : true
type IsOptional<T> = Extract<T, undefined> extends never ? false : true

type ZodWithEffects<T> = T | ZodType<T> | ZodDefault<T extends ZodType ? T : ZodType<T>> | ZodEffects<T extends ZodType ? T : ZodType<T>, any, any>

/**
 * See https://github.com/colinhacks/tozod/blob/master/src/index.ts
 * Adapted based on https://github.com/colinhacks/zod/issues/372
 */
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
