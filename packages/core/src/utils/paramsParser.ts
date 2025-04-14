/**
 * Use Case	Output
 * 🔹 Pure destructure	{ user: { name, age }, flags }
 * 🔹 Destructure + defaults	{ user: { name, age = 30 }, flags = { debug: false } }
 * 🔹 With type	({ ... }: MySchema)
 * 🔹 Variable	const params: MySchema = { ... }
 * 🔹 Type or Interface	type MySchema = { ... }
 */

/**
 * Option	Description
 * functionCall	Wraps the destructure in a function call
 * useInterface	Uses interface instead of type
 * variableOnly	Generates a const params: Type = { ... }
 * pureObject	Generates { a, b, c } with no default values
 */

import { type z, ZodDefault, ZodOptional, ZodObject, type ZodType } from 'zod'

function unwrapType(zodType: z.ZodTypeAny): { type: z.ZodTypeAny; defaultValue?: any; optional?: boolean } {
  let type = zodType as any
  let defaultValue = undefined
  let optional = false

  while (true) {
    if (type instanceof ZodDefault) {
      defaultValue = type.def.defaultValue()
      type = type.def.innerType
    } else if (type instanceof ZodOptional) {
      optional = true
      type = type.def.innerType
    } else {
      break
    }
  }

  return { type, defaultValue, optional }
}

function getTSPrimitive(zodType: ZodType): string {
  const name = zodType.def.type

  // @ts-ignore
  if (zodType.def.name) {
    // @ts-ignore
    return zodType.def.name
  }

  if (name === 'string') return 'string'
  if (name === 'number') return 'number'
  if (name === 'boolean') return 'boolean'
  if (name === 'array') return 'any[]'
  return 'any'
}

function buildLevel(schema: ZodObject<any>, options: { pureObject?: boolean }): [string, string] {
  const entries = Object.entries(schema.shape)
  const destructureParts: string[] = []
  const typeParts: string[] = []

  for (const [key, zodField] of entries) {
    const { type, defaultValue, optional } = unwrapType(zodField as any)

    if (type instanceof ZodObject) {
      const [nestedDestructure, nestedType] = buildLevel(type, options)
      const defaultStr = !options.pureObject && defaultValue !== undefined ? ` = ${JSON.stringify(defaultValue)}` : ''

      destructureParts.push(`${key}${defaultStr}: ${nestedDestructure}`)
      typeParts.push(`${key}${optional ? '?' : ''}: ${nestedType}`)
    } else {
      const defaultStr = !options.pureObject && defaultValue !== undefined ? ` = ${JSON.stringify(defaultValue)}` : ''

      destructureParts.push(`${key}${defaultStr}`)
      typeParts.push(`${key}${optional ? '?' : ''}: ${getTSPrimitive(type)}`)
    }
  }

  return [`{ ${destructureParts.join(', ')} }`, `{ ${typeParts.join('; ')} }`]
}

export function paramsParser(
  name: string,
  schema: ZodObject<any>,
  options: {
    functionCall?: boolean
    useInterface?: boolean
    useType?: boolean
    variableOnly?: boolean
    pureObject?: boolean
  } = {},
): string {
  const [destructure, typeAnnotation] = buildLevel(schema, options)

  const namedParam = `${destructure}: ${name}`
  const funcCall = namedParam
  const objectAssign = `const params: ${name} = ${destructure.replace(/ =/g, ':')}`
  const justObject = destructure

  if (options.pureObject) return justObject
  if (options.variableOnly) return objectAssign
  if (options.functionCall) return funcCall
  if (options.useInterface) return `interface ${name} ${typeAnnotation}`
  if (options.useType) return `type ${name} = ${typeAnnotation}`

  return namedParam
}
