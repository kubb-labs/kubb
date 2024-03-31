import { File, createRoot, useFile, usePluginManager } from '@kubb/react'
import { SchemaGenerator as Generator } from '@kubb/swagger'
import { pluginKey as swaggerTypeScriptPluginKey } from '@kubb/swagger-ts'
import { Oas, Schema } from '@kubb/swagger/components'
import { useSchema } from '@kubb/swagger/hooks'

import { type fakerKeywordMapper, fakerParser } from './fakerParser.tsx'
import { pluginKey } from './plugin.ts'

import type { AppContextProps } from '@kubb/react'
import type { SchemaGeneratorBuildOptions, SchemaGeneratorOptions, SchemaMethodResult, Schema as SchemaType } from '@kubb/swagger'
import type { SchemaObject } from '@kubb/swagger/oas'
import type { FileMeta, PluginOptions } from './types.ts'

function SchemaImports() {
  const pluginManager = usePluginManager()
  const { path: root } = useFile()
  const { name } = useSchema()

  // used for this.options.typed
  const typeName = pluginManager.resolveName({
    name,
    pluginKey: swaggerTypeScriptPluginKey,
    type: 'type',
  })
  const typeFileName = pluginManager.resolveName({
    name: name,
    pluginKey: swaggerTypeScriptPluginKey,
    type: 'file',
  })
  const typePath = pluginManager.resolvePath({
    baseName: typeFileName,
    pluginKey: swaggerTypeScriptPluginKey,
  })

  return (
    <>
      <File.Import name={['faker']} path="@faker-js/faker" />
      {typeName && typePath && <File.Import isTypeOnly root={root} path={typePath} name={[typeName]} />}
    </>
  )
}

export class SchemaGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions> {
  async schema(name: string, object: SchemaObject): SchemaMethodResult<FileMeta> {
    const { oas, pluginManager, mode, plugin, output } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({
      logger: pluginManager.logger,
    })

    root.render(
      <Oas oas={oas}>
        <Oas.Schema generator={this} name={name} object={object}>
          <Schema.File output={output} mode={mode}>
            <SchemaImports />
          </Schema.File>
        </Oas.Schema>
      </Oas>,
      { meta: { pluginManager, plugin } },
    )

    return root.files
  }

  getSource(name: string, schemas: SchemaType[], { description }: SchemaGeneratorBuildOptions = {}): string[] {
    const texts: string[] = []

    // all checks are also inside this.schema(React)
    const resolvedName = this.context.pluginManager.resolveName({
      name,
      pluginKey,
      type: 'function',
    })
    const typeName = this.context.pluginManager.resolveName({
      name,
      pluginKey: swaggerTypeScriptPluginKey,
      type: 'type',
    })

    const output = fakerParser(schemas, {
      name: resolvedName,
      typeName,
      description,
      mapper: this.options.mapper as typeof fakerKeywordMapper,
      seed: this.options.seed,
    })

    texts.push(output)

    return texts
  }
  /**
   * @deprecated only used for testing
   */
  buildSource(name: string, schema: SchemaObject, options: SchemaGeneratorBuildOptions = {}): string[] {
    const schemas = this.buildSchemas(schema, name)

    return this.getSource(name, schemas, options)
  }
}
