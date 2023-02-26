/* eslint-disable no-param-reassign */
import { pascalCase } from 'change-case'

import { SchemaGenerator } from '@kubb/core'
import type { Oas, OpenAPIV3 } from '@kubb/swagger'
import { isReference, getReference } from '@kubb/swagger'

import { keywordZodNodes } from '../utils/keywordZodNodes'

import type ts from 'typescript'

// based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398

/**
 * Name is the ref name + resolved with the nameResolver
 * Key is the original name used
 */
export type Refs = Record<string, { name: string; key: string }>

type Options = {
  withJSDocs?: boolean
  nameResolver?: (name: string) => string
}
export class ZodGenerator extends SchemaGenerator<Options, OpenAPIV3.SchemaObject, string[]> {
  // Collect the types of all referenced schemas so we can export them later
  refs: Refs = {}

  extraTexts: string[] = []

  aliases: ts.TypeAliasDeclaration[] = []

  // Keep track of already used type aliases
  typeAliases: Record<string, number> = {}

  constructor(public readonly oas: Oas, options: Options = { withJSDocs: true, nameResolver: (name) => name }) {
    super(options)

    return this
  }

  build(schema: OpenAPIV3.SchemaObject, name: string, description?: string) {
    const texts: string[] = []
    const input = this.getTypeFromSchema(schema, name)
    if (description) {
      texts.push(`
      /**
       * @description ${description}
       */`)
    }

    const parseProperty = (item: [string, any]): string => {
      // eslint-disable-next-line prefer-const
      let [fn, args = ''] = item || []

      if (fn === keywordZodNodes.array) return `${fn}(${Array.isArray(args) ? `${args.map(parseProperty).join('')}` : parseProperty(args)})`
      if (fn === keywordZodNodes.union)
        return `${keywordZodNodes.and}(${Array.isArray(args) ? `${fn}([${args.map(parseProperty).join(',')}])` : parseProperty(args)})`
      if (fn === keywordZodNodes.and)
        return Array.isArray(args)
          ? `${args
              .map(parseProperty)
              .map((item) => `${fn}(${item})`)
              .join('')}`
          : `${fn}(${parseProperty(args)})`
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

      // custom type
      if (fn === keywordZodNodes.ref) {
        return args.name
      }

      if (keywordZodNodes[fn]) {
        return `z.${fn}(${args})`
      }

      return `${fn}(${args})`
    }

    const zodOutput = !input.length ? '' : `${input.map(parseProperty).join('')}`

    texts.push(`export const ${name} = ${zodOutput};`)

    return [...this.extraTexts, ...texts]
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
  private getTypeFromProperties(baseSchema?: OpenAPIV3.SchemaObject, baseName?: string): [string, any][] {
    const props = baseSchema?.properties || {}
    const required = baseSchema?.required
    // const additionalProperties = baseSchema?.additionalProperties

    const members = Object.keys(props)
      .map((name) => {
        const validationFunctions: [string, any][] = []

        const schema = props[name] as OpenAPIV3.SchemaObject
        const isRequired = required && required.includes(name)

        validationFunctions.push(...this.getTypeFromSchema(schema as OpenAPIV3.SchemaObject, name))

        if (this.options.withJSDocs && schema.description) {
          validationFunctions.push([keywordZodNodes.describe, `"${schema.description}"`])
        }
        const min = schema.minimum ?? schema.exclusiveMinimum ?? schema.minLength ?? undefined
        const max = schema.maximum ?? schema.exclusiveMaximum ?? schema.maxLength ?? undefined
        const matches = schema.pattern ?? undefined

        if (min !== undefined) {
          validationFunctions.push([keywordZodNodes.min, min])
        }
        if (max !== undefined) {
          validationFunctions.push([keywordZodNodes.max, max])
        }
        if (matches) {
          validationFunctions.push([keywordZodNodes.matches, matches])
        }

        if (!isRequired) {
          validationFunctions.push([keywordZodNodes.optional, undefined])
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

    return [[keywordZodNodes.object, members]]
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
      ref = this.refs[$ref] = {
        name: this.options.nameResolver?.(name) || name,
        key: name,
      }
    }

    return [[keywordZodNodes.ref, ref || keywordZodNodes.any]]
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
      // union
      const schemaWithoutOneOf = { ...schema, oneOf: undefined }

      return [
        ...this.getBaseTypeFromSchema(schemaWithoutOneOf, name),
        [
          keywordZodNodes.union,
          schema.oneOf.map((item: OpenAPIV3.ReferenceObject) => {
            return this.getRefAlias(item)[0]
          }),
        ],
      ]
    }

    if (schema.anyOf) {
      // TODO anyOf -> union
    }
    if (schema.allOf) {
      // intersection/add
      const schemaWithoutAllOf = { ...schema, allOf: undefined }

      return [
        ...this.getBaseTypeFromSchema(schemaWithoutAllOf, name),
        [
          keywordZodNodes.and,
          schema.allOf.map((item: OpenAPIV3.ReferenceObject) => {
            return this.getRefAlias(item)[0]
          }),
        ],
      ]
    }

    if (schema.enum) {
      return [[keywordZodNodes.enum, [`[${schema.enum.map((value) => `\`${value}\``).join(', ')}]`]]]
    }

    if ('items' in schema) {
      // items -> array
      return [[keywordZodNodes.array, this.getTypeFromSchema(schema.items as OpenAPIV3.SchemaObject, name)]]
    }

    if (schema.properties || schema.additionalProperties) {
      // properties -> literal type
      return this.getTypeFromProperties(schema, name)
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
