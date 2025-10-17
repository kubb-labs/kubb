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

  const isSimpleString = name === 'string'
  const isSimpleInt = name === 'integer'
  const isSimpleFloat = name === 'float'

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

    if (canOverride && isSimpleString) {
    fakerTextWithOverride = 'data ?? faker.string.alpha()'
  }

  if (canOverride && isSimpleInt) {
    fakerTextWithOverride = 'data ?? faker.number.int()'
  }

   if (canOverride && isSimpleFloat) {
    fakerTextWithOverride = 'data ?? faker.number.float()'
  }

  let type = `Partial<${typeName}>`

  if(isArray)
    type = typeName

  else if(isSimpleString)
      type = name

  else if(isSimpleInt || isSimpleFloat)
      type = 'number'

  const params = FunctionParams.factory({
    data: {
      // making a partial out of an array does not make sense
      type,
      optional: true,
    },
  })

  let returnType = canOverride ? typeName : undefined

  if(isSimpleString || isSimpleInt || isSimpleFloat)
      returnType = type

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        export
        name={name}
        JSDoc={{ comments: [description ? `@description ${transformers.jsStringEscape(description)}` : undefined].filter(Boolean) }}
        params={canOverride ? params.toConstructor() : undefined}
        returnType={returnType}
      >
        {seed ? `faker.seed(${JSON.stringify(seed)})` : undefined}
        <br />
        {`return ${fakerTextWithOverride}`}
      </Function>
    </File.Source>
  )
}
