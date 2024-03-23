import { SchemaGenerator, schemaKeywords } from '@kubb/swagger'
import { pluginKey as swaggerTypeScriptPluginKey } from '@kubb/swagger-ts'

import { pluginKey } from './plugin.ts'
import { zodParser } from './zodParser.tsx'

import type { SchemaGeneratorBuildOptions } from '@kubb/swagger'

export class ZodGenerator extends SchemaGenerator {
  build({
    schema,
    name: baseName,
    keysToOmit,
    operation,
    description,
  }: SchemaGeneratorBuildOptions): string[] {
    const texts: string[] = []
    const input = this.getTypeFromSchema(schema, baseName)

    const withTypeAnnotation = this.options.typed && !operation

    // used for this.options.typed
    const typeName = this.context.pluginManager.resolveName({ name: baseName, pluginKey: swaggerTypeScriptPluginKey, type: 'type' })

    // hack so Params will be optional when needed
    const required = Array.isArray(schema?.required) ? !!schema.required.length : !!schema?.required
    const optional = !required && !!baseName.includes('Params')
    if (optional) {
      input.push({
        keyword: schemaKeywords.optional,
      })
    }

    const output = zodParser(input, {
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
