import transformers from '@kubb/core/transformers'
import type { SchemaObject } from '@kubb/oas'
import { isKeyword, type Schema, schemaKeywords } from '@kubb/plugin-oas'
import { Const, File, Type } from '@kubb/react'
import * as parserZod from '../parser.ts'
import type { PluginZod } from '../types.ts'

type Props = {
  name: string
  typeName?: string
  inferTypeName?: string
  tree: Array<Schema>
  rawSchema: SchemaObject
  description?: string
  coercion: PluginZod['resolvedOptions']['coercion']
  mapper: PluginZod['resolvedOptions']['mapper']
  keysToOmit?: string[]
  wrapOutput?: PluginZod['resolvedOptions']['wrapOutput']
  version: '3' | '4'
  emptySchemaType: PluginZod['resolvedOptions']['emptySchemaType']
}

export function Zod({
  name,
  typeName,
  tree,
  rawSchema,
  inferTypeName,
  mapper,
  coercion,
  keysToOmit,
  description,
  wrapOutput,
  version,
  emptySchemaType,
}: Props) {
  const hasTuple = tree.some((item) => isKeyword(item, schemaKeywords.tuple))
  const schemas = parserZod.sort(tree).filter((item) => {
    if (hasTuple && (isKeyword(item, schemaKeywords.min) || isKeyword(item, schemaKeywords.max))) {
      return false
    }

    return true
  })

  const output = schemas
    .map((schema, _index, siblings) =>
      parserZod.parse(
        { parent: undefined, current: schema, siblings },
        { name, keysToOmit, typeName, description, mapper, coercion, wrapOutput, rawSchema, version },
      ),
    )
    .filter(Boolean)
    .join('')

  let suffix = ''
  const firstSchema = schemas.at(0)
  const lastSchema = schemas.at(-1)

  if (lastSchema && isKeyword(lastSchema, schemaKeywords.nullable)) {
    if (firstSchema && isKeyword(firstSchema, schemaKeywords.ref)) {
      if (version === '3') {
        suffix = '.unwrap().schema.unwrap()'
      } else {
        suffix = '.unwrap().unwrap()'
      }
    } else {
      suffix = '.unwrap()'
    }
  } else {
    if (firstSchema && isKeyword(firstSchema, schemaKeywords.ref) && version === '3') {
      suffix = '.schema'
    }
  }

  const emptyValue = parserZod.parse(
    {
      parent: undefined,
      current: {
        keyword: schemaKeywords[emptySchemaType],
      },
      siblings: [],
    },
    { name, keysToOmit, typeName, description, mapper, coercion, wrapOutput, rawSchema, version },
  )

  const baseSchemaOutput =
    [output, keysToOmit?.length ? `${suffix}.omit({ ${keysToOmit.map((key) => `${key}: true`).join(',')} })` : undefined].filter(Boolean).join('') ||
    emptyValue ||
    ''
  const wrappedSchemaOutput = wrapOutput ? wrapOutput({ output: baseSchemaOutput, schema: rawSchema }) || baseSchemaOutput : baseSchemaOutput
  const finalOutput = typeName ? `${wrappedSchemaOutput} as unknown as ToZod<${typeName}>` : wrappedSchemaOutput

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
