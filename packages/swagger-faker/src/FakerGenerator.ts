import { SchemaGenerator } from '@kubb/swagger'
import { pluginKey as swaggerTypeScriptPluginKey } from '@kubb/swagger-ts'

import { fakerParser } from './fakerParser.tsx'
import { pluginKey } from './plugin.ts'

import type { Schema as SchemaType, SchemaGeneratorBuildOptions, SchemaGeneratorOptions } from '@kubb/swagger'
import type { SchemaObject } from '@kubb/swagger/oas'

type Options = SchemaGeneratorOptions & {
  seed?: number | number[]
}

export class FakerGenerator extends SchemaGenerator<Options> {
  async schema() {
    return null
  }

  getSource(name: string, schemas: SchemaType[], {
    operationName,
    operation,
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
    // hack to add typescript imports
    if (typeName) {
      const typeFileName = this.context.pluginManager.resolveName({ name, pluginKey: swaggerTypeScriptPluginKey, type: 'file' })

      const typePath = this.context.pluginManager.resolvePath({
        baseName: operationName || typeFileName,
        pluginKey: swaggerTypeScriptPluginKey,
        options: { tag: operation?.getTags()[0]?.name },
      })

      if (typePath) {
        this.imports.push({
          ref: {
            propertyName: typeName,
            originalName: name,
            path: typePath,
            pluginKey: swaggerTypeScriptPluginKey,
          },
          path: typePath,
          isTypeOnly: true,
        })
      }
    }

    texts.push(output)

    return texts
  }
  buildSource(name: string, schema: SchemaObject, options: SchemaGeneratorBuildOptions = {}): string[] {
    const schemas = this.buildSchemas(schema, name)

    return this.getSource(name, schemas, options)
  }
}
