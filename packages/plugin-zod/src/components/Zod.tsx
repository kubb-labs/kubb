import transformers from '@kubb/core/transformers'
import { type Schema, schemaKeywords } from '@kubb/plugin-oas'
import { isKeyword } from '@kubb/plugin-oas'
import { Const, File, Type } from '@kubb/react'
import type { KubbNode } from '@kubb/react/types'
import * as parserZod from '../parser/index.ts'
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

export function Zod({ name, typeName, tree, inferTypeName, mapper, coercion, keysToOmit, description }: Props): KubbNode {
  const hasTuple = tree.some((item) => isKeyword(item, schemaKeywords.tuple))

  const output = parserZod
    .sort(tree)
    .filter((item) => {
      if (hasTuple && (isKeyword(item, schemaKeywords.min) || isKeyword(item, schemaKeywords.max))) {
        return false
      }

      return true
    })
    .map((item) => parserZod.parse(undefined, item, { name, keysToOmit, typeName: typeName, description, mapper, coercion }))
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
            typeName ? ` as z.ZodType<${typeName}>` : '',
          ]
            .filter(Boolean)
            .join('') || ''}
        </Const>
      </File.Source>
      {inferTypeName && (
        <File.Source name={inferTypeName} isExportable isIndexable isTypeOnly>
          <Type export name={inferTypeName}>
            {`z.infer<typeof ${name}>`}
          </Type>
        </File.Source>
      )}
    </>
  )
}
