import { SchemaGenerator, schemaKeywords } from '@kubb/swagger'
import { pluginKey as swaggerTypeScriptPluginKey } from '@kubb/swagger-ts'

import { pluginKey } from './plugin.ts'
import { zodParser } from './zodParser.tsx'

import type { SchemaGeneratorBuildOptions } from '@kubb/swagger'
import type { SchemaObject } from '@kubb/swagger/oas'

export class ZodGenerator extends SchemaGenerator {
  async schema() {
    return null
  }
  buildSource(baseName: string, schema: SchemaObject, {
    keysToOmit,
    operation,
    description,
  }: SchemaGeneratorBuildOptions = {}): string[] {
    const texts: string[] = []
    const schemas = this.buildSchemas(schema, baseName)

    const withTypeAnnotation = this.options.typed && !operation

    // used for this.options.typed
    const typeName = this.context.pluginManager.resolveName({ name: baseName, pluginKey: swaggerTypeScriptPluginKey, type: 'type' })

    // hack so Params will be optional when needed
    const required = Array.isArray(schema?.required) ? !!schema.required.length : !!schema?.required
    const optional = !required && !!baseName.includes('Params')
    if (optional) {
      schemas.push({
        keyword: schemaKeywords.optional,
      })
    }

    const output = zodParser(schemas, {
      keysToOmit,
      name: this.context.pluginManager.resolveName({ name: baseName, pluginKey, type: 'function' }),
      description,
      typeName: withTypeAnnotation
        ? typeName
        : undefined,
    })

    if (withTypeAnnotation && typeName) {
      const typeFileName = this.context.pluginManager.resolveName({ name: baseName, pluginKey: swaggerTypeScriptPluginKey, type: 'file' })
      const typePath = this.context.pluginManager.resolvePath({ baseName: typeFileName, pluginKey: swaggerTypeScriptPluginKey })

      if (typePath) {
        this.imports.push({
          ref: {
            propertyName: typeName,
            originalName: baseName,
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
}
