import type { Booleans, Call, Objects, Strings, Tuples } from 'hotscript'
import type { Object } from 'ts-toolbelt'
type Checks = {
  AllOFf: { allOf: any[] }
  Object: {
    type: 'object'
    properties: any
  }
  Properties: { properties: any }
  PropertiesRequired: {
    properties: Record<string, any>
    required: string[]
  }
}

type FixAdditionalPropertiesForAllOf<T> = T extends Checks['AllOFf']
  ? Omit<T, 'allOf'> & {
      allOf: Call<Tuples.Map<Objects.Omit<'additionalProperties'>>, T['allOf']>
    }
  : T

type FixMissingAdditionalProperties<T> = T extends Checks['Object'] ? Omit<T, 'additionalProperties'> & { additionalProperties: false } : T
type FixMissingTypeObject<T> = T extends Checks['Properties'] ? T & { type: 'object' } : T

type FixExtraRequiredFields<T> = T extends Checks['PropertiesRequired']
  ? Omit<T, 'required'> & {
      required: Call<Tuples.Filter<Booleans.Extends<keyof T['properties']>>, T['required']>
    }
  : T

// Later suggest using json-machete
type FixJSONSchema<T> = FixAdditionalPropertiesForAllOf<FixMissingAdditionalProperties<FixMissingTypeObject<FixExtraRequiredFields<T>>>>

type Mutable<Type> = FixJSONSchema<{
  -readonly [Key in keyof Type]: Mutable<Type[Key]>
}>

type RefToPath<T extends string> = T extends `#/${infer Ref}` ? Call<Strings.Split<'/'>, Ref> : never

type ResolveRef<TObj, TRef extends string> = {
  $id: TRef
} & Object.Path<TObj, RefToPath<TRef>>

type ResolveRefInObj<T, TBase> = T extends { $ref: infer Ref } ? (Ref extends string ? ResolveRef<TBase, Ref> : T) : T

type ResolveRefsInObj<T, TBase = T> = {
  [K in keyof T]: ResolveRefsInObj<ResolveRefInObj<T[K], TBase>, TBase>
}

export type Infer<TOas> = Mutable<ResolveRefsInObj<TOas>>
