import { z as zInternal, type ZodType } from 'zod'

function zRef(name: string): ZodType<string> {
  const schema = zInternal.custom(() => true, { message: `z.ref(${name})` }) as ZodType<string>
  schema.def.type = 'ref' as 'string'
  // @ts-ignore
  schema.def.value = name
  return schema
}

function zParam(name: string): ZodType<string> {
  const schema = zInternal.custom(() => true, { message: `z.param(${name})` }) as ZodType<string>
  schema.def.type = 'param' as 'string'
  // @ts-ignore
  schema.def.name = name
  return schema
}

export function zOf(type: 'string' | 'number' | 'boolean' | 'ref') {
  if (type === 'string') {
    return zInternal.string
  }

  return zInternal.any
}

export const z = {
  string: zInternal.string,
  number: zInternal.number,
  boolean: zInternal.boolean,
  object: zInternal.object,
  ref: zRef,
  param: zParam,
  params: zInternal.tuple,
  of: zOf,
}
