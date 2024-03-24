import { createRoot, File, useFile, usePlugin, usePluginManager } from '@kubb/react'
import { schemaKeywords } from '@kubb/swagger'
import { SchemaGenerator as Generator } from '@kubb/swagger'
import { Oas, Schema } from '@kubb/swagger/components'
import { useSchema } from '@kubb/swagger/hooks'
import { pluginKey as swaggerTypeScriptPluginKey } from '@kubb/swagger-ts'

import { pluginKey } from './plugin.ts'
import { zodParser } from './zodParser.tsx'

import type { AppContextProps } from '@kubb/react'
import type { Schema as SchemaType, SchemaGeneratorBuildOptions, SchemaMethodResult } from '@kubb/swagger'
import type { SchemaObject } from '@kubb/swagger/oas'
import type { FileMeta, PluginOptions } from './types.ts'

function SchemaImports() {
  const plugin = usePlugin<PluginOptions>()
  const pluginManager = usePluginManager()
  const { path: root } = useFile()
  const { name } = useSchema()

  const withTypeAnnotation = plugin.options.typed

  // used for this.options.typed
  const typeName = pluginManager.resolveName({ name, pluginKey: swaggerTypeScriptPluginKey, type: 'type' })
  const typeFileName = pluginManager.resolveName({ name: name, pluginKey: swaggerTypeScriptPluginKey, type: 'file' })
  const typePath = pluginManager.resolvePath({ baseName: typeFileName, pluginKey: swaggerTypeScriptPluginKey })

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

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })

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

  getSource(name: string, schemas: SchemaType[], {
    keysToOmit,
    operation,
    description,
    required,
  }: SchemaGeneratorBuildOptions & { required?: boolean } = {}): string[] {
    const texts: string[] = []

    // all checks are also inside this.schema(React)
    const withTypeAnnotation = this.options.typed && !operation

    // used for this.options.typed
    const typeName = this.context.pluginManager.resolveName({ name, pluginKey: swaggerTypeScriptPluginKey, type: 'type' })

    // this has been moved to OperationSchema
    const optional = !required && !!name.includes('Params')
    if (optional) {
      schemas.push({
        keyword: schemaKeywords.optional,
      })
    }

    const output = zodParser(schemas, {
      keysToOmit,
      name: this.context.pluginManager.resolveName({ name: name, pluginKey, type: 'function' }),
      description,
      typeName: withTypeAnnotation
        ? typeName
        : undefined,
    })

    texts.push(output)

    return texts
  }
  /**
   * @deprecated only used for testing
   */
  buildSource(name: string, schema: SchemaObject, options: SchemaGeneratorBuildOptions = {}): string[] {
    const schemas = this.buildSchemas(schema, name)

    // all checks are also inside this.schema(React)
    // hack so Params will be optional when needed
    const required = Array.isArray(schema?.required) ? !!schema.required.length : !!schema?.required

    return this.getSource(name, schemas, { ...options, required })
  }
}
