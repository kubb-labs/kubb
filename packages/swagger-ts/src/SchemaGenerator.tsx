import { createRoot } from '@kubb/react'
import { SchemaGenerator as Generator } from '@kubb/swagger'
import { Oas } from '@kubb/swagger/components'
import { pluginKey as swaggerTypeScriptPluginKey } from '@kubb/swagger-ts'

import { Schema } from './components/Schema.tsx'
import { pluginKey } from './plugin.ts'
import { typeParser } from './typeParser.ts'

import type { AppContextProps } from '@kubb/react'
import type { SchemaGeneratorBuildOptions, SchemaMethodResult } from '@kubb/swagger'
import type { SchemaObject } from '@kubb/swagger/oas'
import type { FileMeta, PluginOptions } from './types.ts'

export class SchemaGenerator extends Generator<PluginOptions['resolvedOptions'], PluginOptions> {
  async schema(name: string, schema: SchemaObject): SchemaMethodResult<FileMeta> {
    const { oas, pluginManager, mode, plugin } = this.context

    const root = createRoot<AppContextProps<PluginOptions['appMeta']>>({ logger: pluginManager.logger })

    root.render(
      <Oas oas={oas}>
        <Oas.Schema name={name} schema={schema}>
          <Schema.File generator={this} mode={mode} />
        </Oas.Schema>
      </Oas>,
      { meta: { pluginManager, plugin } },
    )

    return root.files
  }

  buildSchema(baseName: string, schema: SchemaObject, {
    keysToOmit,
    description,
  }: SchemaGeneratorBuildOptions = {}): string[] {
    const texts: string[] = []
    const input = this.getTypeFromSchema(schema, baseName)

    const name = this.context.pluginManager.resolveName({ name: baseName, pluginKey, type: 'function' })
    const typeName = this.context.pluginManager.resolveName({ name: baseName, pluginKey: swaggerTypeScriptPluginKey, type: 'type' })

    const typeOutput = typeParser(input, {
      name,
      typeName,
      description,
      enumType: this.options.enumType || 'asConst',
      optionalType: this.options.optionalType,
      keysToOmit,
    })

    texts.push(typeOutput)

    return texts
  }
}
