import { File, Function } from '@kubb/react'

import transformers from '@kubb/core/transformers'
import { type Schema, schemaKeywords } from '@kubb/plugin-oas'
import * as parserFaker from '../parser/index.ts'
import type { PluginFaker } from '../types.ts'
import type { KubbNode } from '@kubb/react/types'

type Props = {
  name: string
  typedName: string
  tree: Array<Schema>
  seed?: PluginFaker['options']['seed']
  description?: string
  regexGenerator?: PluginFaker['options']['regexGenerator']
  mapper?: PluginFaker['options']['mapper']
  dateParser?: PluginFaker['options']['dateParser']
}

export function Faker({ tree, description, name, typedName, seed, regexGenerator, mapper, dateParser }: Props): KubbNode {
  const withData = tree.some(
    (schema) =>
      schema.keyword === schemaKeywords.array ||
      schema.keyword === schemaKeywords.and ||
      schema.keyword === schemaKeywords.object ||
      schema.keyword === schemaKeywords.union ||
      schema.keyword === schemaKeywords.tuple,
  )

  const fakerText = parserFaker.joinItems(
    tree
      .map((schema) =>
        parserFaker.parse(undefined, schema, {
          name,
          typeName: typedName,
          seed,
          regexGenerator,
          mapper,
          withData,
          dateParser,
        }),
      )
      .filter(Boolean),
  )

  let fakerDefaultOverride: '' | '[]' | '{}' | undefined = undefined
  let fakerTextWithOverride = fakerText

  if (withData && fakerText.startsWith('{')) {
    fakerDefaultOverride = '{}'
    fakerTextWithOverride = `{
  ...${fakerText},
  ...data
}`
  }

  if (withData && fakerText.startsWith('faker.helpers.arrayElements')) {
    fakerDefaultOverride = '[]'
    fakerTextWithOverride = `[
      ...${fakerText},
      ...data
    ]`
  }

  //TODO use of createFunctionParams
  const params = fakerDefaultOverride ? `data: NonNullable<Partial<${typedName}>> = ${fakerDefaultOverride}` : `data?: NonNullable<Partial<${typedName}>>`

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        export
        name={name}
        JSDoc={{ comments: [description ? `@description ${transformers.jsStringEscape(description)}` : undefined].filter(Boolean) }}
        params={withData ? params : ''}
        returnType={typedName ? `NonNullable<${typedName}>` : ''}
      >
        {seed ? `faker.seed(${JSON.stringify(seed)})` : ''}
        <br />
        <Function.Return>{fakerTextWithOverride}</Function.Return>
      </Function>
    </File.Source>
  )
}
