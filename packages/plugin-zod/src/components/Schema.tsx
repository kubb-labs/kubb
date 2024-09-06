import { Const, File, Type } from '@kubb/react'
import { type Schema, schemaKeywords } from '@kubb/plugin-oas'
import transformers from '@kubb/core/transformers'
import { isKeyword } from '@kubb/plugin-oas'
import * as parserZod from '../parser/index.ts'
import type { PluginZod } from '../types.ts'
import type {KubbNode} from "@kubb/react/types";

type Props = {
  name: string
  typedName?: string
  inferTypedName?: string
  tree: Array<Schema>
  description?: string
  coercion?: PluginZod['options']['coercion']
  mapper?: PluginZod['options']['mapper']
}

export function Schema({  name, typedName, tree,inferTypedName,  mapper, coercion, description }: Props): KubbNode {
  if (!tree.length) {
    return (
      <File.Source name={name} isExportable isIndexable>
        <Const
          name={name}
          export
          JSDoc={{
            comments: [description ? `@description ${transformers.jsStringEscape(description)}` : undefined].filter(Boolean),
          }}
        >
          undefined
        </Const>
      </File.Source>
    )
  }

  const hasTuple = tree.some((item) => isKeyword(item, schemaKeywords.tuple))

  const output = parserZod
    .sort(tree)
    .filter((item) => {
      if (hasTuple && (isKeyword(item, schemaKeywords.min) || isKeyword(item, schemaKeywords.max))) {
        return false
      }

      return true
    })
    .map((item) => parserZod.parse(undefined, item, { name, typeName: typedName, description, mapper, coercion }))
    .filter(Boolean)
    .join('')

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
            typedName ? ` as z.ZodType<${typedName}>` : '',
          ]
            .filter(Boolean)
            .join('') || ''}
        </Const>
      </File.Source>
      {inferTypedName && (
        <File.Source name={inferTypedName} isExportable isIndexable isTypeOnly>
          <Type export name={inferTypedName}>
            {`z.infer<typeof ${name}>`}
          </Type>
        </File.Source>
      )}
    </>
  )
}

