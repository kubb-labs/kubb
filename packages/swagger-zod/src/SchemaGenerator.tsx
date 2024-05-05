import { App, File, createRoot, useApp, useFile } from '@kubb/react'
import { SchemaGenerator as Generator } from '@kubb/swagger'
import { pluginKey as swaggerTypeScriptPluginKey } from '@kubb/swagger-ts'
import { Oas, Schema } from '@kubb/swagger/components'
import { useSchema } from '@kubb/swagger/hooks'

import { pluginKey } from './plugin.ts'
import { zodParser } from './zodParser.tsx'

import type { SchemaObject } from '@kubb/oas'
import type { SchemaGeneratorBuildOptions, SchemaMethodResult, Schema as SchemaType } from '@kubb/swagger'
import type { FileMeta, PluginOptions } from './types.ts'

function SchemaImports() {
  const { plugin, pluginManager } = useApp<PluginOptions>()
  const { path: root } = useFile()
  const { name } = useSchema()

  const withTypeAnnotation = plugin.options.typed

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
      <File.Import name={['z']} path="zod" />
      {withTypeAnnotation && typeName && typePath && <File.Import isTypeOnly root={root} path={typePath} name={[typeName]} />}
    </>
  )
}

export class SchemaGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions> {
  async schema(name: string, object: SchemaObject): SchemaMethodResult<FileMeta> {
    const { oas, pluginManager, mode, plugin, output } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    root.render(
      <App pluginManager={pluginManager} plugin={plugin} mode={mode}>
        <Oas oas={oas}>
          <Oas.Schema generator={this} name={name} object={object}>
            <Schema.File output={output}>
              <SchemaImports />
            </Schema.File>
          </Oas.Schema>
        </Oas>
      </App>,
    )

    return root.files
  }

  getSource(name: string, schemas: SchemaType[], { keysToOmit, operation, description }: SchemaGeneratorBuildOptions & { required?: boolean } = {}): string[] {
    const texts: string[] = []

    // all checks are also inside this.schema(React)
    const withTypeAnnotation = this.options.typed && !operation

    // used for this.options.typed
    const typeName = this.context.pluginManager.resolveName({
      name,
      pluginKey: swaggerTypeScriptPluginKey,
      type: 'type',
    })

    const output = zodParser(schemas, {
      keysToOmit,
      name: this.context.pluginManager.resolveName({
        name: name,
        pluginKey,
        type: 'function',
      }),
      description,
      mapper: this.options.mapper,
      typeName: withTypeAnnotation ? typeName : undefined,
    })

    texts.push(output)

    return texts
  }
  /**
   * @deprecated only used for testing
   */
  buildSource(name: string, schema: SchemaObject, options: SchemaGeneratorBuildOptions = {}): string[] {
    const schemas = this.buildSchemas({ schema, name })

    // all checks are also inside this.schema(React)
    // hack so Params will be optional when needed
    const required = Array.isArray(schema?.required) ? !!schema.required.length : !!schema?.required

    return this.getSource(name, schemas, { ...options, required })
  }
}
