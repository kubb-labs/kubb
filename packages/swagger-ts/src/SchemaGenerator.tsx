import { createRoot } from '@kubb/react'
import { SchemaGenerator as Generator } from '@kubb/swagger'
import { Oas, Schema } from '@kubb/swagger/components'
import { pluginKey as swaggerTypeScriptPluginKey } from '@kubb/swagger-ts'

import { pluginKey } from './plugin.ts'
import { typeParser } from './typeParser.ts'

import type { AppContextProps } from '@kubb/react'
import type { Schema as SchemaType, SchemaGeneratorBuildOptions, SchemaMethodResult } from '@kubb/swagger'
import type { SchemaObject } from '@kubb/swagger/oas'
import type { FileMeta, PluginOptions } from './types.ts'

export class SchemaGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions> {
  async schema(name: string, object: SchemaObject): SchemaMethodResult<FileMeta> {
    const { oas, pluginManager, mode, plugin, output } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })

    root.render(
      <Oas oas={oas}>
        <Oas.Schema generator={this} name={name} object={object}>
          <Schema.File isTypeOnly output={output} mode={mode} />
        </Oas.Schema>
      </Oas>,
      { meta: { pluginManager, plugin } },
    )

    return root.files
  }
  // TODO convert to a react component called `Schema.Parser` with props parser as part of the SchemaContext
  getSource(name: string, schemas: SchemaType[], {
    keysToOmit,
    description,
  }: SchemaGeneratorBuildOptions = {}): string[] {
    const texts: string[] = []

    const resolvedName = this.context.pluginManager.resolveName({ name, pluginKey, type: 'function' })
    const resvoledTypeName = this.context.pluginManager.resolveName({ name, pluginKey: swaggerTypeScriptPluginKey, type: 'type' })

    const typeOutput = typeParser(schemas, {
      name: resolvedName,
      typeName: resvoledTypeName,
      description,
      enumType: this.options.enumType || 'asConst',
      optionalType: this.options.optionalType,
      keysToOmit,
    })

    texts.push(typeOutput)

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
