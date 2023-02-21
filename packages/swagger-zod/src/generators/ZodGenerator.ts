/* eslint-disable no-param-reassign */
import { pascalCase } from 'change-case'

import { SchemaGenerator } from '@kubb/core'

import { keywordZodNodes } from '../utils/codegen'
import { isReference } from '../utils/isReference'
import { getReference } from '../utils/getReference'

import type ts from 'typescript'
import type Oas from 'oas'
import type { OpenAPIV3 } from 'openapi-types'

// based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398

export type FileResolver = (name: string) => Promise<string | null | undefined>
type Name = string
export type Refs = Record<string, Name>

type Options = {
  withJSDocs?: boolean
  nameResolver?: (name: string) => string
}
export class ZodGenerator extends SchemaGenerator<Options, OpenAPIV3.SchemaObject, string> {
  // Collect the types of all referenced schemas so we can export them later
  refs: Refs = {}

  aliases: ts.TypeAliasDeclaration[] = []

  // Keep track of already used type aliases
  typeAliases: Record<string, number> = {}

  constructor(public readonly oas: Oas, options: Options = { withJSDocs: true, nameResolver: (name) => name }) {
    super(options)

    return this
  }

  build(schema: OpenAPIV3.SchemaObject, name: string, description?: string) {
    const input = this.getTypeFromSchema(schema, name)
    if (description) {
      // return appendJSDocToNode({
      //   node,
      //   comments: [`@description ${description}`],
      // })
    }

    const parseProperty = (item: [string, any]): string => {
      // eslint-disable-next-line prefer-const
      let [fn, args = ''] = item || []

      if (fn === keywordZodNodes.array) return `zod.array(${Array.isArray(args) ? `${args.map(parseProperty).join('')}` : parseProperty(args)})`
      if (fn === keywordZodNodes.object) {
        if (!args) {
          args = '{}'
        }
        const argsObject = Object.entries(args)
          .filter(([_key, schema]: [string, any]) => {
            return schema && typeof schema.map === 'function'
          })
          .map(([key, schema]: [string, any]) => `"${key}": ${schema.map(parseProperty).join('')}`)
          .join(',')

        args = `{${argsObject}}`
      }

      if (keywordZodNodes[fn]) {
        return `zod.${fn}(${args})`
      }

      // custom type
      if (fn === 'ref') {
        return `${args}`
      }

      return `.${fn}(${args})`
    }

    const zodOutput = !input.length ? '' : `${input.map(parseProperty).join('')}`

    return `export const ${name} = ${zodOutput};`
  }

  /**
   * Creates a type node from a given schema.
   * Delegates to getBaseTypeFromSchema internally and
   * optionally adds a union with null.
   */
  private getTypeFromSchema(schema: OpenAPIV3.SchemaObject, name?: string): [string, any][] {
    const validationFunctions = this.getBaseTypeFromSchema(schema, name)
    if (validationFunctions) {
      return validationFunctions
    }

    return []
  }

  /**
   * Recursively creates a type literal with the given props.
   */
  private getTypeFromProperties(
    props: {
      [prop: string]: OpenAPIV3.SchemaObject
    },
    required?: string[],
    additionalProperties?: boolean | OpenAPIV3.SchemaObject
  ): [string, any][] {
    const members = Object.keys(props)
      .map((name) => {
        const validationFunctions: [string, any][] = []

        const schema = props[name]
        const isRequired = required && required.includes(name)

        if (!schema.enum) {
          // when we have an enum we will convert that to z.enum() instead z.string().enum()
          validationFunctions.push(...this.getTypeFromSchema(schema as OpenAPIV3.SchemaObject, name))
        }

        if (schema.enum) {
          validationFunctions.push(['enum', [`[${schema.enum.map((value) => `'${value}'`).join(', ')}]`]])
        }

        if (this.options.withJSDocs && schema.description) {
          validationFunctions.push(['describe', `"${schema.description}"`])
        }
        const min = schema.minimum ?? schema.exclusiveMinimum ?? schema.minLength ?? undefined
        const max = schema.maximum ?? schema.exclusiveMaximum ?? schema.maxLength ?? undefined
        const matches = schema.pattern ?? undefined

        if (min !== undefined) {
          validationFunctions.push(['min', min])
        }
        if (max !== undefined) {
          validationFunctions.push(['max', max])
        }
        if (matches) {
          validationFunctions.push(['matches', matches])
        }

        if (!isRequired) {
          validationFunctions.push(['optional', undefined])
        }

        return {
          [name]: validationFunctions,
        }
      })
      .reduce((acc, curr) => ({ ...acc, ...curr }), {})

    // if (additionalProperties) {
    //   const type = additionalProperties === true ? keywordZodNodes.any : this.getTypeFromSchema(additionalProperties)

    //   members.push(createIndexSignature(type))
    // }

    return [['object', members]]
  }

  private resolve<T>(obj: T | OpenAPIV3.ReferenceObject) {
    if (!isReference(obj)) return obj
    const ref = obj.$ref
    if (!ref.startsWith('#/')) {
      throw new Error(`External refs are not supported (${ref}). Make sure to call SwaggerParser.bundle() first.`)
    }
    return getReference(this.oas.api, ref) as T
  }

  private getUniqueAlias(name: string) {
    let used = this.typeAliases[name] || 0
    if (used) {
      this.typeAliases[name] = ++used
      name += used
    }
    this.typeAliases[name] = 1
    return name
  }

  /**
   * Create a type alias for the schema referenced by the given ReferenceObject
   */
  private getRefAlias(obj: OpenAPIV3.ReferenceObject): [string, any][] {
    const { $ref } = obj
    let ref = this.refs[$ref]

    if (!ref) {
      const schema = this.resolve<OpenAPIV3.SchemaObject>(obj)
      const name = this.getUniqueAlias(pascalCase(schema.title || $ref.replace(/.+\//, '')))

      // eslint-disable-next-line no-multi-assign
      ref = this.refs[$ref] = this.options.nameResolver?.(name) || name
    }

    return [['ref', ref || keywordZodNodes.any]]
  }

  /**
   * This is the very core of the OpenAPI to TS conversion - it takes a
   * schema and returns the appropriate type.
   */
  private getBaseTypeFromSchema(schema: OpenAPIV3.SchemaObject | undefined, name?: string): [string, any][] {
    if (!schema) {
      return [[keywordZodNodes.any, undefined]]
    }

    if (isReference(schema)) {
      return this.getRefAlias(schema)
    }

    if (schema.oneOf) {
      // TODO oneOf -> union
    }

    if (schema.anyOf) {
      // TODO anyOf -> union
    }
    if (schema.allOf) {
      // TODO allOf -> intersection
    }

    if (schema.enum) {
      // TODO enum
    }

    if ('items' in schema) {
      // items -> array
      return [['array', this.getTypeFromSchema(schema.items as OpenAPIV3.SchemaObject, name)]]
    }

    if (schema.properties || schema.additionalProperties) {
      // properties -> literal type
      return this.getTypeFromProperties(schema.properties || ({} as any), schema.required, schema.additionalProperties as any)
    }

    if (schema.type) {
      // string, boolean, null, number
      if (schema.type in keywordZodNodes) {
        return keywordZodNodes[schema.type] ? [[keywordZodNodes[schema.type], undefined]] : [[schema.type, undefined]]
      }
    }

    if (schema.format === 'binary') {
      // TODO binary
    }

    return [[keywordZodNodes.any, undefined]]
  }
}
