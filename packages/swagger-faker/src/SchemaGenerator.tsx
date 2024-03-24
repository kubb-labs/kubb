import { createRoot } from '@kubb/react'
import { SchemaGenerator as Generator } from '@kubb/swagger'
import { Oas, Schema } from '@kubb/swagger/components'
import { pluginKey as swaggerTypeScriptPluginKey } from '@kubb/swagger-ts'

import { fakerParser } from './fakerParser.tsx'
import { pluginKey } from './plugin.ts'

import type { AppContextProps } from '@kubb/react'
import type { Schema as SchemaType, SchemaGeneratorBuildOptions, SchemaGeneratorOptions, SchemaMethodResult } from '@kubb/swagger'
import type { SchemaObject } from '@kubb/swagger/oas'
import type { FileMeta, PluginOptions } from './types.ts'

type Options = SchemaGeneratorOptions & {
  seed?: number | number[]
}

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

  getSource(name: string, schemas: SchemaType[], {
    description,
  }: SchemaGeneratorBuildOptions = {}): string[] {
    const texts: string[] = []

    const resolvedName = this.context.pluginManager.resolveName({ name, pluginKey, type: 'function' })
    const typeName = this.context.pluginManager.resolveName({ name, pluginKey: swaggerTypeScriptPluginKey, type: 'type' })

    const output = fakerParser(schemas, {
      name: resolvedName,
      typeName,
      description,
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
