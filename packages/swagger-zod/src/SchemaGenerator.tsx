import { SchemaGenerator as Generator } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { useSchema } from '@kubb/plugin-oas/hooks'
import { App, File, createRoot, useApp, useFile } from '@kubb/react'
import { pluginTsName } from '@kubb/swagger-ts'

import { zodParser } from './zodParser.tsx'

import { pluginZodName } from './plugin.ts'

import type { SchemaObject } from '@kubb/oas'
import type { SchemaGeneratorBuildOptions, SchemaMethodResult, Schema as SchemaType } from '@kubb/plugin-oas'
import type { FileMeta, PluginZod } from './types.ts'

function SchemaImports() {
  const { plugin, pluginManager } = useApp<PluginZod>()
  const { path: root } = useFile()
  const { name } = useSchema()

  const withTypeAnnotation = plugin.options.typed

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
      <File.Import name={['z']} path="zod" />
      {withTypeAnnotation && typeName && typePath && <File.Import isTypeOnly root={root} path={typePath} name={[typeName]} />}
    </>
  )
}

export class SchemaGenerator extends Generator<PluginZod['resolvedOptions'], PluginZod> {
  async schema(name: string, schema: SchemaObject): SchemaMethodResult<FileMeta> {
    const { oas, pluginManager, mode, plugin, output } = this.context

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

  getSource(name: string, schemas: SchemaType[], { keysToOmit, operation, description }: SchemaGeneratorBuildOptions & { required?: boolean } = {}): string[] {
    const texts: string[] = []

    // all checks are also inside this.schema(React)
    const withTypeAnnotation = this.options.typed && !operation

    // used for this.options.typed
    const typeName = this.context.pluginManager.resolveName({
      name,
      pluginKey: [pluginTsName],
      type: 'type',
    })

    const output = zodParser(schemas, {
      keysToOmit,
      name: this.context.pluginManager.resolveName({
        name: name,
        pluginKey: [pluginZodName],
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
    const schemas = this.parse({ schema, name })

    // all checks are also inside this.schema(React)
    // hack so Params will be optional when needed
    const required = Array.isArray(schema?.required) ? !!schema.required.length : !!schema?.required

    return this.getSource(name, schemas, { ...options, required })
  }
}
