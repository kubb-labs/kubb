/* eslint-disable no-param-reassign */
import { pascalCase } from 'change-case'
import uniq from 'lodash.uniq'

import type { PluginContext } from '@kubb/core'
import { getUniqueName, SchemaGenerator } from '@kubb/core'
import type { Oas, OpenAPIV3 } from '@kubb/swagger'
import { isReference } from '@kubb/swagger'

import { keywordZodNodes } from '../utils/keywordZodNodes'
import { pluginName } from '../plugin'

import type ts from 'typescript'

// based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398

function zodKeywordMapper(a: [string, unknown], b: [string, unknown]) {
  if (b[0] === keywordZodNodes.null) {
    return -1
  }

  return 0
}

/**
 * Name is the ref name + resolved with the nameResolver
 * Key is the original name used
 */
export type Refs = Record<string, { name: string; key: string }>

type Options = {
  withJSDocs?: boolean
  resolveName: PluginContext['resolveName']
}
export class ZodGenerator extends SchemaGenerator<Options, OpenAPIV3.SchemaObject, string[]> {
  // Collect the types of all referenced schemas so we can export them later
  refs: Refs = {}

  extraTexts: string[] = []

  aliases: ts.TypeAliasDeclaration[] = []

  // Keep track of already used type aliases
  usedAliasNames: Record<string, number> = {}

  constructor(public readonly oas: Oas, options: Options = { withJSDocs: true, resolveName: ({ name }) => name }) {
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

      if (fn === keywordZodNodes.array) {
        return `${fn}(${Array.isArray(args) ? `${args.map(parseProperty).join('')}` : parseProperty(args)})`
      }
      if (fn === keywordZodNodes.union) {
        return `${keywordZodNodes.and}(${Array.isArray(args) ? `${fn}([${args.map(parseProperty).join(',')}])` : parseProperty(args)})`
      }

      if (fn === keywordZodNodes.catchall) {
        return `${fn}(${Array.isArray(args) ? `${args.map(parseProperty).join('')}` : parseProperty(args)})`
      }

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
          .filter((item) => {
            const schema = item[1] as [string, unknown][]
            return schema && typeof schema.map === 'function'
          })
          .map((item) => {
            const key = item[0] as string
            const schema = item[1] as [string, unknown][]
            return `"${key}": ${schema.sort(zodKeywordMapper).map(parseProperty).join('')}`
          })
          .join(',')

        args = `{${argsObject}}`
      }

      // custom type
      if (fn === keywordZodNodes.ref) {
        // use of z.lazy because we need to import from files x or we use the type as a self referene
        return `z.lazy(() => ${args.name})`
      }

      if (keywordZodNodes[fn as keyof typeof keywordZodNodes]) {
        return `${fn}(${args})`
      }

      return `${fn}(${args})`
    }

    const zodOutput = !input.length ? '' : `${input.map(parseProperty).join('')}`

    texts.push(`export const ${this.options.resolveName({ name, pluginName }) || name} = ${zodOutput};`)

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
  private getTypeFromProperties(baseSchema?: OpenAPIV3.SchemaObject, baseName?: string): [string, unknown][] {
    const props = baseSchema?.properties || {}
    const required = baseSchema?.required
    const additionalProperties = baseSchema?.additionalProperties

    const objectMembers = Object.keys(props)
      .map((name) => {
        const validationFunctions: [string, unknown][] = []

        const schema = props[name] as OpenAPIV3.SchemaObject
        const isRequired = required && required.includes(name)

        validationFunctions.push(...this.getTypeFromSchema(schema as OpenAPIV3.SchemaObject, name))

        if (this.options.withJSDocs && schema.description) {
          validationFunctions.push([keywordZodNodes.describe, `\`${schema.description.replaceAll('\n', ' ').replaceAll('`', "'")}\``])
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
          validationFunctions.push([keywordZodNodes.matches, `/${matches}/`])
        }

        if (!isRequired) {
          validationFunctions.push([keywordZodNodes.optional, undefined])
        }

        return {
          [name]: validationFunctions,
        }
      })
      .reduce((acc, curr) => ({ ...acc, ...curr }), {})

    const members: [string, unknown][] = []

    members.push([keywordZodNodes.object, objectMembers])

    if (additionalProperties) {
      const addionalValidationFunctions =
        additionalProperties === true ? [keywordZodNodes.any, undefined] : this.getTypeFromSchema(additionalProperties as OpenAPIV3.SchemaObject)

      members.push([keywordZodNodes.catchall, addionalValidationFunctions])
    }

    return members
  }

  /**
   * Create a type alias for the schema referenced by the given ReferenceObject
   */
  private getRefAlias(obj: OpenAPIV3.ReferenceObject): [string, unknown][] {
    const { $ref } = obj
    let ref = this.refs[$ref]

    if (!ref) {
      const name = pascalCase(getUniqueName($ref.replace(/.+\//, ''), this.usedAliasNames), { delimiter: '' })

      // eslint-disable-next-line no-multi-assign
      ref = this.refs[$ref] = {
        name: this.options.resolveName({ name, pluginName }) || name,
        key: name,
      }
    }

    return [[keywordZodNodes.ref, ref || keywordZodNodes.any]]
  }

  /**
   * This is the very core of the OpenAPI to TS conversion - it takes a
   * schema and returns the appropriate type.
   */
  private getBaseTypeFromSchema(schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined, name?: string): [string, unknown][] {
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
          schema.oneOf.map((item) => {
            return this.getBaseTypeFromSchema(item)[0]
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
          schema.allOf.map((item) => {
            return this.getBaseTypeFromSchema(item)[0]
          }),
        ],
      ]
    }

    if (schema.enum) {
      if ('x-enumNames' in schema) {
        return [
          [
            keywordZodNodes.enum,
            [
              `[${uniq(schema['x-enumNames'] as string[])
                .map((value) => `\`${value}\``)
                .join(', ')}]`,
            ],
          ],
        ]
      }

      return [
        [
          keywordZodNodes.enum,
          [
            `[${uniq(schema.enum)
              .map((value) => `\`${value}\``)
              .join(', ')}]`,
          ],
        ],
      ]
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
      if (Array.isArray(schema.type)) {
        // OPENAPI v3.1.0: https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
        const [type, nullable] = schema.type

        return [
          ...this.getBaseTypeFromSchema(
            {
              ...schema,
              type,
            },
            name
          ),
          [keywordZodNodes.null, undefined],
        ]
      }

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
