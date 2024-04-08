export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type PossiblePromise<T> = Promise<T> | T

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never
type LastOf<T> = UnionToIntersection<T extends any ? () => T : never> extends () => infer R ? R : never

// TS4.0+
type Push<T extends any[], V> = [...T, V]

// TS4.1+
type TuplifyUnion<T, L = LastOf<T>, N = [T] extends [never] ? true : false> = true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>

export type ObjValueTuple<T, KS extends any[] = TuplifyUnion<keyof T>, R extends any[] = []> = KS extends [infer K, ...infer KT]
  ? ObjValueTuple<T, KT, [...R, [name: K & keyof T, options: T[K & keyof T]]]>
  : R

export type TupleToUnion<T> = T extends any[] ? T[number] : never

type ArrayWithLength<T extends number, U extends any[] = []> = U['length'] extends T ? U : ArrayWithLength<T, [true, ...U]>

export type GreaterThan<T extends number, U extends number> = ArrayWithLength<U> extends [...ArrayWithLength<T>, ...infer _] ? false : true

export type SplitByDelimiter<T extends string, D extends string> = T extends `${infer P}${D}${infer Q}` ? [P, ...SplitByDelimiter<Q, D>] : [T]
