import { Oas } from '@kubb/plugin-oas/components'
import { File, Function, useApp, useFile } from '@kubb/react'
import { pluginTsName } from '@kubb/swagger-ts'

import transformers from '@kubb/core/transformers'
import { schemaKeywords } from '@kubb/plugin-oas'
import { useSchema } from '@kubb/plugin-oas/hooks'
import type { ReactNode } from 'react'
import * as parserFaker from '../parser/index.ts'
import { pluginFakerName } from '../plugin.ts'
import type { PluginFaker } from '../types.ts'

type Props = {
  description?: string
  withData?: boolean
}

export function Schema(props: Props): ReactNode {
  const { withData, description } = props
  const { tree, name } = useSchema()
  const {
    pluginManager,
    plugin: {
      options: { dateParser, regexGenerator, mapper, seed },
    },
  } = useApp<PluginFaker>()

  // all checks are also inside this.schema(React)
  const resolvedName = pluginManager.resolveName({
    name,
    pluginKey: [pluginFakerName],
    type: 'function',
  })

  const typeName = pluginManager.resolveName({
    name,
    pluginKey: [pluginTsName],
    type: 'type',
  })

  const fakerText = parserFaker.joinItems(
    tree
      .map((schema) => parserFaker.parse(undefined, schema, { name: resolvedName, typeName, seed, regexGenerator, mapper, withData, dateParser }))
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

  const params = fakerDefaultOverride ? `data: NonNullable<Partial<${typeName}>> = ${fakerDefaultOverride}` : `data?: NonNullable<Partial<${typeName}>>`

  return (
    <>
      <Function
        export
        name={resolvedName}
        JSDoc={{ comments: [description ? `@description ${transformers.jsStringEscape(description)}` : undefined].filter(Boolean) }}
        params={withData ? params : ''}
        returnType={typeName ? `NonNullable<${typeName}>` : ''}
      >
        {seed ? `faker.seed(${JSON.stringify(seed)})` : ''}
        <br />
        <Function.Return>{fakerTextWithOverride}</Function.Return>
      </Function>
      <br />
    </>
  )
}

type FileProps = {}

Schema.File = function ({}: FileProps): ReactNode {
  const { pluginManager } = useApp<PluginFaker>()
  const { tree, schema } = useSchema()

  const withData = tree.some(
    (schema) =>
      schema.keyword === schemaKeywords.array ||
      schema.keyword === schemaKeywords.and ||
      schema.keyword === schemaKeywords.object ||
      schema.keyword === schemaKeywords.union ||
      schema.keyword === schemaKeywords.tuple,
  )

  return (
    <Oas.Schema.File output={pluginManager.config.output.path}>
      <Schema.Imports />
      <File.Source>
        <Schema description={schema?.description} withData={withData} />
      </File.Source>
    </Oas.Schema.File>
  )
}
Schema.Imports = (): ReactNode => {
  const {
    pluginManager,
    plugin: {
      options: { dateParser, regexGenerator },
    },
  } = useApp<PluginFaker>()
  const { path: root } = useFile()
  const { name, tree, schema } = useSchema()

  // used for this.options.typed
  const typeName = pluginManager.resolveName({
    name,
    pluginKey: [pluginTsName],
    type: 'type',
  })

  const typeFileName = pluginManager.resolveName({
    name: name,
    pluginKey: [pluginTsName],
    type: 'file',
  })

  const typePath = pluginManager.resolvePath({
    baseName: typeFileName,
    pluginKey: [pluginTsName],
  })

  return (
    <>
      <File.Import name={['faker']} path="@faker-js/faker" />
      {regexGenerator === 'randexp' && <File.Import name={'RandExp'} path={'randexp'} />}
      {dateParser && <File.Import path={dateParser} name={dateParser} />}
      {typeName && typePath && <File.Import isTypeOnly root={root} path={typePath} name={[typeName]} />}
    </>
  )
}
