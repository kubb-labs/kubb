import { SchemaGenerator as Generator, schemaKeywords } from '@kubb/plugin-oas'
import { Oas, Schema } from '@kubb/plugin-oas/components'
import { useSchema } from '@kubb/plugin-oas/hooks'
import { App, File, createRoot, useApp, useFile } from '@kubb/react'
import { pluginTsName } from '@kubb/swagger-ts'

import { fakerParser } from './fakerParser.tsx'
import { pluginFakerName } from './plugin.ts'

import type { SchemaObject } from '@kubb/oas'
import type { SchemaGeneratorBuildOptions, SchemaMethodResult, Schema as SchemaType } from '@kubb/plugin-oas'
import type { FileMeta, PluginFaker } from './types.ts'

function SchemaImports() {
  const { pluginManager } = useApp()
  const { path: root } = useFile()
  const { name } = useSchema()

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
      {typeName && typePath && <File.Import isTypeOnly root={root} path={typePath} name={[typeName]} />}
    </>
  )
}

export class SchemaGenerator extends Generator<PluginFaker['resolvedOptions'], PluginFaker> {
  async schema(name: string, schema: SchemaObject): SchemaMethodResult<FileMeta> {
    const { oas, pluginManager, plugin, mode, output } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    const tree = this.parse({ schema, name })
    const source = this.getSource(name, tree)

    root.render(
      <App pluginManager={pluginManager} plugin={plugin} mode={mode}>
        <Oas oas={oas}>
          <Oas.Schema name={name} value={schema} tree={tree}>
            <Oas.Schema.File output={output}>
              <SchemaImports />
              {source.join('\n')}
            </Oas.Schema.File>
          </Oas.Schema>
        </Oas>
      </App>,
    )

    return root.files
  }

  getSource(name: string, schemas: SchemaType[], { withData = true, description }: SchemaGeneratorBuildOptions = {}): string[] {
    const texts: string[] = []

    // all checks are also inside this.schema(React)
    const resolvedName = this.context.pluginManager.resolveName({
      name,
      pluginKey: [pluginFakerName],
      type: 'function',
    })
    const typeName = this.context.pluginManager.resolveName({
      name,
      pluginKey: [pluginTsName],
      type: 'type',
    })

    const output = fakerParser(schemas, {
      name: resolvedName,
      typeName,
      description,
      mapper: this.options.mapper,
      seed: this.options.seed,
      withData:
        withData &&
        schemas.some(
          (schema) =>
            schema.keyword === schemaKeywords.array ||
            schema.keyword === schemaKeywords.and ||
            schema.keyword === schemaKeywords.object ||
            schema.keyword === schemaKeywords.union ||
            schema.keyword === schemaKeywords.tuple,
        ),
    })

    texts.push(output)

    return texts
  }
  /**
   * @deprecated only used for testing
   */
  buildSource(name: string, schema: SchemaObject, options: SchemaGeneratorBuildOptions = {}): string[] {
    const schemas = this.parse({ schema, name })

    return this.getSource(name, schemas, options)
  }
}
