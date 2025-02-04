import transformers from '@kubb/core/transformers'
import { type Schema, schemaKeywords } from '@kubb/plugin-oas'
import { isKeyword } from '@kubb/plugin-oas'
import { Const, File, Type } from '@kubb/react'
import * as parserZod from '../parser.ts'
import type { PluginZod } from '../types.ts'

type Props = {
  name: string
  typeName?: string
  inferTypeName?: string
  tree: Array<Schema>
  description?: string
  coercion: PluginZod['resolvedOptions']['coercion']
  mapper: PluginZod['resolvedOptions']['mapper']
  keysToOmit?: string[]
}

export function Zod({ name, typeName, tree, inferTypeName, mapper, coercion, keysToOmit, description }: Props) {
  const hasTuple = tree.some((item) => isKeyword(item, schemaKeywords.tuple))

  const output = parserZod
    .sort(tree)
    .filter((item) => {
      if (hasTuple && (isKeyword(item, schemaKeywords.min) || isKeyword(item, schemaKeywords.max))) {
        return false
      }

      return true
    })
    .map((schema, _index, siblings) =>
      parserZod.parse({ parent: undefined, current: schema, siblings }, { name, keysToOmit, typeName, description, mapper, coercion }),
    )
    .filter(Boolean)
    .join('')

  const suffix = output.endsWith('.nullable()') ? '.unwrap().and' : '.and'

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
          {[
            output,
            keysToOmit?.length ? `${suffix}(z.object({ ${keysToOmit.map((key) => `${key}: z.never()`).join(',')} }))` : undefined,
            typeName ? `as unknown as ToZod<${typeName}>` : undefined,
          ]
            .filter(Boolean)
            .join('') || 'z.undefined()'}
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
