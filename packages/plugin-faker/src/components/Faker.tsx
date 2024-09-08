import { File, Function, FunctionParams } from '@kubb/react'

import transformers from '@kubb/core/transformers'
import type { Schema } from '@kubb/plugin-oas'
import type { KubbNode } from '@kubb/react/types'
import * as parserFaker from '../parser/index.ts'
import type { PluginFaker } from '../types.ts'

type Props = {
  name: string
  typeName: string
  tree: Array<Schema>
  seed?: PluginFaker['options']['seed']
  description?: string
  regexGenerator?: PluginFaker['options']['regexGenerator']
  mapper?: PluginFaker['options']['mapper']
  dateParser?: PluginFaker['options']['dateParser']
  canOverride: boolean
}

export function Faker({ tree, description, name, typeName, seed, regexGenerator, canOverride, mapper, dateParser }: Props): KubbNode {
  const fakerText = parserFaker.joinItems(
    tree
      .map((schema) =>
        parserFaker.parse(undefined, schema, {
          name,
          typeName,
          seed,
          regexGenerator,
          mapper,
          canOverride,
          dateParser,
        }),
      )
      .filter(Boolean),
  )

  let fakerDefaultOverride: '' | '[]' | '{}' | undefined = undefined
  let fakerTextWithOverride = fakerText

  if (canOverride && fakerText.startsWith('{')) {
    fakerDefaultOverride = '{}'
    fakerTextWithOverride = `{
  ...${fakerText},
  ...data
}`
  }

  if (canOverride && fakerText.startsWith('faker.helpers.arrayElements')) {
    fakerDefaultOverride = '[]'
    fakerTextWithOverride = `[
      ...${fakerText},
      ...data
    ]`
  }

  const params = FunctionParams.factory({
    data: fakerDefaultOverride
      ? {
          type: `NonNullable<Partial<${typeName}>>`,
          default: fakerDefaultOverride,
        }
      : undefined,
  })

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        export
        name={name}
        JSDoc={{ comments: [description ? `@description ${transformers.jsStringEscape(description)}` : undefined].filter(Boolean) }}
        params={params.toConstructor()}
      >
        {seed ? `faker.seed(${JSON.stringify(seed)})` : undefined}
        <br />
        {`return ${fakerTextWithOverride}`}
      </Function>
    </File.Source>
  )
}
