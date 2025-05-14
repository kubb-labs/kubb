import { File, Function, FunctionParams } from '@kubb/react'

import transformers from '@kubb/core/transformers'
import type { Schema } from '@kubb/plugin-oas'
import * as parserFaker from '../parser.ts'
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

export function Faker({ tree, description, name, typeName, seed, regexGenerator, canOverride, mapper, dateParser }: Props) {
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

  const isArray = fakerText.startsWith('faker.helpers.arrayElements') || fakerText.startsWith('faker.helpers.multiple')
  const isObject = fakerText.startsWith('{')
  const isTuple = fakerText.startsWith('faker.helpers.arrayElement')

  let fakerTextWithOverride = fakerText

  if (canOverride && isObject) {
    fakerTextWithOverride = `{
  ...${fakerText},
  ...data || {}
}`
  }

  if (canOverride && isTuple) {
    fakerTextWithOverride = `data || ${fakerText}`
  }

  if (canOverride && isArray) {
    fakerTextWithOverride = `[
      ...${fakerText},
      ...data || []
    ]`
  }

  const params = FunctionParams.factory({
    data: {
      // making a partial out of an array does not make sense
      type: isArray ? typeName : `Partial<${typeName}>`,
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
        returnType={canOverride ? typeName : undefined}
      >
        {seed ? `faker.seed(${JSON.stringify(seed)})` : undefined}
        <br />
        {`return ${fakerTextWithOverride}`}
      </Function>
    </File.Source>
  )
}
