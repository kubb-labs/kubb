import { SchemaGenerator as Generator } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App, createRoot } from '@kubb/react'

import { pluginTsName } from './plugin.ts'
import { typeParser } from './typeParser.ts'

import type { SchemaObject } from '@kubb/oas'
import type { SchemaGeneratorBuildOptions, SchemaMethodResult, Schema as SchemaType } from '@kubb/plugin-oas'
import type { FileMeta, PluginTs } from './types.ts'

export class SchemaGenerator extends Generator<PluginTs['resolvedOptions'], PluginTs> {
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
            <Oas.Schema.File isTypeOnly output={output}>
              {source.join('\n')}
            </Oas.Schema.File>
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
    const schemas = this.parse({ schema, name })

    return this.getSource(name, schemas, options)
  }
}
