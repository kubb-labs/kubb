import transformers from '@kubb/core/transformers'
import { SchemaGenerator, schemaKeywords } from '@kubb/swagger'
import { pluginKey as swaggerTypeScriptPluginKey } from '@kubb/swagger-ts'

import { pluginKey } from './plugin.ts'
import { zodParser } from './zodParser.ts'

import type { SchemaGeneratorBuildOptions } from '@kubb/swagger'

export class ZodGenerator extends SchemaGenerator {
  build({
    schema,
    baseName,
    description,
    optional,
    keysToOmit,
    operation,
  }: SchemaGeneratorBuildOptions): string[] {
    const texts: string[] = []
    const zodInput = this.getTypeFromSchema(schema, baseName)
    if (description) {
      texts.push(`
      /**
       * @description ${transformers.trim(description)}
       */`)
    }

    if (optional) {
      zodInput.push({
        keyword: schemaKeywords.optional,
      })
    }

    const withTypeAnnotation = this.options.typed && !operation

    // used for this.options.typed
    const typeName = this.context.pluginManager.resolveName({ name: baseName, pluginKey: swaggerTypeScriptPluginKey, type: 'type' })

    const zodOutput = zodParser(zodInput, {
      required: !!schema?.required,
      keysToOmit,
      name: this.context.pluginManager.resolveName({ name: baseName, pluginKey, type: 'function' }),
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

    texts.push(zodOutput)

    return [...this.extraTexts, ...texts]
  }
}
