import transformers from '@kubb/core/transformers'
import type { SchemaObject } from '@kubb/oas'
import { isKeyword, type Schema, SchemaGenerator, schemaKeywords } from '@kubb/plugin-oas'
import { Const, File, Type } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import * as parserZod from '../parser.ts'
import type { PluginZod } from '../types.ts'

type Props = {
  name: string
  typeName?: string
  inferTypeName?: string
  tree: Array<Schema>
  schema: SchemaObject
  description?: string
  coercion: PluginZod['resolvedOptions']['coercion']
  mapper: PluginZod['resolvedOptions']['mapper']
  keysToOmit?: string[]
  wrapOutput?: PluginZod['resolvedOptions']['wrapOutput']
  version: '3' | '4'
  emptySchemaType: PluginZod['resolvedOptions']['emptySchemaType']
  mini?: boolean
}

export function Zod({
  name,
  typeName,
  tree,
  schema,
  inferTypeName,
  mapper,
  coercion,
  keysToOmit,
  description,
  wrapOutput,
  version,
  emptySchemaType,
  mini = false,
}: Props): FabricReactNode {
  const hasTuple = !!SchemaGenerator.find(tree, schemaKeywords.tuple)

  const schemas = parserZod.sort(tree).filter((item) => {
    if (hasTuple && (isKeyword(item, schemaKeywords.min) || isKeyword(item, schemaKeywords.max))) {
      return false
    }

    return true
  })

  // In mini mode, filter out modifiers from the main schema parsing
  const baseSchemas = mini ? parserZod.filterMiniModifiers(schemas) : schemas

  const output = baseSchemas
    .map((schemaKeyword, index) => {
      const siblings = baseSchemas.filter((_, i) => i !== index)

      return parserZod.parse({ schema, parent: undefined, current: schemaKeyword, siblings, name }, { mapper, coercion, wrapOutput, version, mini })
    })
    .filter(Boolean)
    .join('')

  let suffix = ''
  const firstSchema = schemas.at(0)
  const lastSchema = schemas.at(-1)

  if (!mini && lastSchema && isKeyword(lastSchema, schemaKeywords.nullable)) {
    if (firstSchema && isKeyword(firstSchema, schemaKeywords.ref)) {
      if (version === '3') {
        suffix = '.unwrap().schema.unwrap()'
      } else {
        suffix = '.unwrap().unwrap()'
      }
    } else {
      suffix = '.unwrap()'
    }
  } else if (!mini) {
    if (firstSchema && isKeyword(firstSchema, schemaKeywords.ref)) {
      if (version === '3') {
        suffix = '.schema'
      } else {
        suffix = '.unwrap()'
      }
    }
  }

  const emptyValue = parserZod.parse(
    {
      schema,
      parent: undefined,
      current: {
        keyword: schemaKeywords[emptySchemaType],
      },
      siblings: [],
    },
    { mapper, coercion, wrapOutput, version, mini },
  )

  let baseSchemaOutput =
    [output, keysToOmit?.length ? `${suffix}.omit({ ${keysToOmit.map((key) => `'${key}': true`).join(',')} })` : undefined].filter(Boolean).join('') ||
    emptyValue ||
    ''

  // For mini mode, wrap the output with modifiers using the parser function
  if (mini) {
    baseSchemaOutput = parserZod.wrapWithMiniModifiers(baseSchemaOutput, parserZod.extractMiniModifiers(schemas))
  }

  const wrappedSchemaOutput = wrapOutput ? wrapOutput({ output: baseSchemaOutput, schema }) || baseSchemaOutput : baseSchemaOutput
  const finalOutput = typeName ? `${wrappedSchemaOutput} as unknown as ${version === '4' ? 'z.ZodType' : 'ToZod'}<${typeName}>` : wrappedSchemaOutput

  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        <Const
          export
          name={name}
          JSDoc={{
            comments: [description ? `@description ${transformers.jsStringEscape(description)}` : undefined].filter(Boolean),
          }}
        >
          {finalOutput}
        </Const>
      </File.Source>
      {inferTypeName && (
        <File.Source name={inferTypeName} isExportable isIndexable isTypeOnly>
          {typeName && (
            <Type export name={inferTypeName}>
              {typeName}
            </Type>
          )}
          {!typeName && (
            <Type export name={inferTypeName}>
              {`z.infer<typeof ${name}>`}
            </Type>
          )}
        </File.Source>
      )}
    </>
  )
}
