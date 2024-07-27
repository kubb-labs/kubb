import { Oas } from '@kubb/plugin-oas/components'
import { Const, File, Type, useApp, useFile } from '@kubb/react'
import { pluginTsName } from '@kubb/swagger-ts'

import transformers from '@kubb/core/transformers'
import { isKeyword, schemaKeywords } from '@kubb/plugin-oas'
import { useSchema } from '@kubb/plugin-oas/hooks'
import type { ReactNode } from 'react'
import * as parserZod from '../parser/index.ts'
import { pluginZodName } from '../plugin.ts'
import type { PluginZod } from '../types.ts'

type Props = {
  description?: string
  withTypeAnnotation?: boolean
  keysToOmit?: string[]
}

export function Schema(props: Props): ReactNode {
  const { keysToOmit, withTypeAnnotation, description } = props
  const { tree, name } = useSchema()
  const {
    pluginManager,
    plugin: {
      options: { mapper, typedSchema, coercion },
    },
  } = useApp<PluginZod>()

  // all checks are also inside this.schema(React)
  const resolvedName = pluginManager.resolveName({
    name,
    pluginKey: [pluginZodName],
    type: 'function',
  })
  const resolvedTypeName = pluginManager.resolveName({
    name,
    pluginKey: [pluginZodName],
    type: 'type',
  })

  const typeName = pluginManager.resolveName({
    name,
    pluginKey: [pluginTsName],
    type: 'type',
  })

  if (!tree.length) {
    return (
      <Const
        name={resolvedName}
        export
        JSDoc={{
          comments: [description ? `@description ${transformers.jsStringEscape(description)}` : undefined].filter(Boolean),
        }}
      >
        undefined
      </Const>
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
    .map((item) => parserZod.parse(undefined, item, { name, typeName, description, mapper, coercion, keysToOmit }))
    .filter(Boolean)
    .join('')

  const suffix = output.endsWith('.nullable()') ? '.unwrap().and' : '.and'

  return (
    <>
      <Const
        export
        name={resolvedName}
        JSDoc={{
          comments: [description ? `@description ${transformers.jsStringEscape(description)}` : undefined].filter(Boolean),
        }}
      >
        {[
          output,
          keysToOmit?.length ? `${suffix}(z.object({ ${keysToOmit.map((key) => `${key}: z.never()`).join(',')} }))` : undefined,
          withTypeAnnotation && typeName ? ` as z.ZodType<${typeName}>` : '',
        ]
          .filter(Boolean)
          .join('') || ''}
      </Const>
      {typedSchema && (
        <Type export name={resolvedTypeName}>
          {`z.infer<typeof ${resolvedName}>`}
        </Type>
      )}
    </>
  )
}

type FileProps = {}

Schema.File = function ({}: FileProps): ReactNode {
  const {
    pluginManager,
    plugin: {
      options: { typed },
    },
  } = useApp<PluginZod>()
  const { tree, schema } = useSchema()

  const withData = tree.some(
    (schema) =>
      schema.keyword === schemaKeywords.array ||
      schema.keyword === schemaKeywords.and ||
      schema.keyword === schemaKeywords.object ||
      schema.keyword === schemaKeywords.union ||
      schema.keyword === schemaKeywords.tuple,
  )

  const withTypeAnnotation = !!typed

  return (
    <Oas.Schema.File output={pluginManager.config.output.path}>
      <Schema.Imports />
      <File.Source>
        <Schema withTypeAnnotation={withTypeAnnotation} description={schema?.description} />
      </File.Source>
    </Oas.Schema.File>
  )
}
Schema.Imports = (): ReactNode => {
  const {
    pluginManager,
    plugin: {
      options: { typed, importPath },
    },
  } = useApp<PluginZod>()
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

  const withTypeAnnotation = !!typed

  return (
    <>
      <File.Import name={['z']} path={importPath} />
      {withTypeAnnotation && typeName && typePath && <File.Import isTypeOnly root={root} path={typePath} name={[typeName]} />}
    </>
  )
}
