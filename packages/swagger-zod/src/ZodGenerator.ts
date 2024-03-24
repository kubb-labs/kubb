import { SchemaGenerator, schemaKeywords } from '@kubb/swagger'
import { pluginKey as swaggerTypeScriptPluginKey } from '@kubb/swagger-ts'

import { pluginKey } from './plugin.ts'
import { zodParser } from './zodParser.tsx'

import type { Schema as SchemaType, SchemaGeneratorBuildOptions } from '@kubb/swagger'
import type { SchemaObject } from '@kubb/swagger/oas'

export class ZodGenerator extends SchemaGenerator {
  async schema() {
    return null
  }

  getSource(name: string, schemas: SchemaType[], {
    keysToOmit,
    operation,
    description,
    required,
  }: SchemaGeneratorBuildOptions & { required?: boolean } = {}): string[] {
    const texts: string[] = []
    const withTypeAnnotation = this.options.typed && !operation

    // used for this.options.typed
    const typeName = this.context.pluginManager.resolveName({ name, pluginKey: swaggerTypeScriptPluginKey, type: 'type' })

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

    if (withTypeAnnotation && typeName) {
      const typeFileName = this.context.pluginManager.resolveName({ name: name, pluginKey: swaggerTypeScriptPluginKey, type: 'file' })
      const typePath = this.context.pluginManager.resolvePath({ baseName: typeFileName, pluginKey: swaggerTypeScriptPluginKey })

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

    // hack so Params will be optional when needed
    const required = Array.isArray(schema?.required) ? !!schema.required.length : !!schema?.required

    return this.getSource(name, schemas, { ...options, required })
  }
}
