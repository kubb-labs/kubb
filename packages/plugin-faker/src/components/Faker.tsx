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
      .map((schema, _index, siblings) =>
        parserFaker.parse(
          { parent: undefined, current: schema, siblings },
          {
            name,
            typeName,
            seed,
            regexGenerator,
            mapper,
            canOverride,
            dateParser,
          },
        ),
      )
      .filter(Boolean),
  )

  let fakerTextWithOverride = fakerText

  if (canOverride && fakerText.startsWith('{')) {
    fakerTextWithOverride = `{
  ...${fakerText},
  ...data || {}
}`
  }

  if (canOverride && fakerText.startsWith('faker.helpers.arrayElement')) {
    fakerTextWithOverride = `data || ${fakerText}`
  }

  if ((canOverride && fakerText.startsWith('faker.helpers.arrayElements')) || fakerText.startsWith('faker.helpers.multiple')) {
    fakerTextWithOverride = `[
      ...${fakerText},
      ...data || []
    ]`
  }

  const params = FunctionParams.factory({
    data: {
      type: `Partial<${typeName}>`,
      optional: true,
    },
  })

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        export
        name={name}
        JSDoc={{ comments: [description ? `@description ${transformers.jsStringEscape(description)}` : undefined].filter(Boolean) }}
        params={canOverride ? params.toConstructor() : undefined}
      >
        {seed ? `faker.seed(${JSON.stringify(seed)})` : undefined}
        <br />
        {`return ${fakerTextWithOverride}`}
      </Function>
    </File.Source>
  )
}
