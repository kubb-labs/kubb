import { App, createRoot } from '@kubb/react'
import { SchemaGenerator as Generator } from '@kubb/swagger'
import { Oas } from '@kubb/swagger/components'

import { pluginTsName } from './plugin.ts'
import { typeParser } from './typeParser.ts'

import type { SchemaObject } from '@kubb/oas'
import type { SchemaGeneratorBuildOptions, SchemaMethodResult, Schema as SchemaType } from '@kubb/swagger'
import type { FileMeta, PluginTs } from './types.ts'

export class SchemaGenerator extends Generator<PluginTs['resolvedOptions'], PluginTs> {
  async schema(name: string, object: SchemaObject): SchemaMethodResult<FileMeta> {
    const { oas, pluginManager, mode, plugin, output } = this.context

    const root = createRoot({
      logger: pluginManager.logger,
    })

    root.render(
      <App pluginManager={pluginManager} plugin={plugin} mode={mode}>
        <Oas oas={oas}>
          <Oas.Schema generator={this} name={name} object={object}>
            <Oas.Schema.File isTypeOnly output={output} />
          </Oas.Schema>
        </Oas>
      </App>,
    )

    return root.files
  }
  // TODO convert to a react component called `Schema.Parser` with props parser as part of the SchemaContext
  getSource(name: string, schemas: SchemaType[], { keysToOmit, description }: SchemaGeneratorBuildOptions = {}): string[] {
    const texts: string[] = []

    const resolvedName = this.context.pluginManager.resolveName({
      name,
      pluginKey: [pluginTsName],
      type: 'function',
    })
    const resolvedTypeName = this.context.pluginManager.resolveName({
      name,
      pluginKey: [pluginTsName],
      type: 'type',
    })

    const typeOutput = typeParser(schemas, {
      name: resolvedName,
      typeName: resolvedTypeName,
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
    const schemas = this.buildSchemas({ schema, name })

    return this.getSource(name, schemas, options)
  }
}
