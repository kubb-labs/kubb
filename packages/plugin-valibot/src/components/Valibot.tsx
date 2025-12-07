import type { SchemaObject } from '@kubb/oas'
import { isKeyword, type Schema, SchemaGenerator, schemaKeywords } from '@kubb/plugin-oas'
import { Const, Type } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
import * as parserValibot from '../parser.ts'
import type { PluginValibot } from '../types.ts'

type Props = {
  name: string
  typeName?: string
  inferTypeName?: string
  tree: Array<Schema>
  schema: SchemaObject
  mapper: PluginValibot['resolvedOptions']['mapper']
  keysToOmit?: string[]
  emptySchemaType: PluginValibot['resolvedOptions']['emptySchemaType']
  dateType: PluginValibot['resolvedOptions']['dateType']
}

export function Valibot({
  name,
  typeName,
  tree,
  schema,
  inferTypeName,
  mapper,
  keysToOmit,
  emptySchemaType,
  dateType,
}: Props): KubbNode {
  const hasTuple = !!SchemaGenerator.find(tree, schemaKeywords.tuple)

  const schemas = parserValibot.sort(tree).filter((item) => {
    if (hasTuple && (isKeyword(item, schemaKeywords.min) || isKeyword(item, schemaKeywords.max))) {
      return false
    }

    return true
  })

  const output = schemas
    .map((schemaItem, index) => {
      const siblings = schemas.filter((_, i) => i !== index)

      return parserValibot.parse({ schema, parent: undefined, current: schemaItem, siblings, name }, { mapper, dateType: dateType || 'string' })
    })
    .filter(Boolean)
    .join('')

  const suffix = ''

  const emptyValue = parserValibot.parse(
    {
      schema,
      parent: undefined,
      current: {
        keyword: schemaKeywords[emptySchemaType],
      },
      siblings: [],
    },
    { mapper, dateType: dateType || 'string' },
  )

  let baseSchemaOutput =
    [output, keysToOmit?.length ? `${suffix}.omit({ ${keysToOmit.map((key) => `'${key}': true`).join(',')} })` : undefined].filter(Boolean).join('') ||
    emptyValue ||
    'v.any()'

  // Handle optional wrapping
  if (schemas.some((s) => isKeyword(s, schemaKeywords.optional))) {
    const nonOptionalSchema = schemas.find((s) => !isKeyword(s, schemaKeywords.optional))
    if (nonOptionalSchema && !output.startsWith('v.optional(')) {
      // Don't double-wrap optional
      baseSchemaOutput = output
    }
  }

  return (
    <>
      <Const export name={name} asConst>
        {baseSchemaOutput}
      </Const>

      {typeName && (
        <>
          {'\n\n'}
          <Type export name={typeName}>
            {`typeof ${name}`}
          </Type>
        </>
      )}

      {inferTypeName && (
        <>
          {'\n\n'}
          <Type export name={inferTypeName}>
            {`v.InferOutput<typeof ${name}>`}
          </Type>
        </>
      )}
    </>
  )
}
