import transformers from '@kubb/core/transformers'
import { SchemaGenerator } from '@kubb/swagger'
import { pluginKey as swaggerTypeScriptPluginKey } from '@kubb/swagger-ts'

import { fakerParser } from './fakerParser.ts'
import { pluginKey } from './plugin.ts'

import type { SchemaGeneratorBuildOptions, SchemaGeneratorOptions } from '@kubb/swagger'

type Options = SchemaGeneratorOptions & {
  seed?: number | number[]
}

export class FakerGenerator extends SchemaGenerator<Options> {
  build({
    schema,
    baseName,
    description,
    operationName,
    operation,
  }: SchemaGeneratorBuildOptions): string[] {
    const texts: string[] = []
    const fakerInput = this.getTypeFromSchema(schema, baseName)
    if (description) {
      texts.push(transformers.JSDoc.createJSDocBlockText({ comments: [`@description ${transformers.trim(description)}`] }))
    }

    const name = this.context.pluginManager.resolveName({ name: baseName, pluginKey, type: 'function' })
    const typeName = this.context.pluginManager.resolveName({ name: baseName, pluginKey: swaggerTypeScriptPluginKey, type: 'type' })

    const fakerOutput = fakerParser(fakerInput, {
      name,
      typeName,
      mapper: this.options.mapper,
      seed: this.options.seed,
    })
    // hack to add typescript imports
    if (typeName) {
      const typeFileName = this.context.pluginManager.resolveName({ name: baseName, pluginKey: swaggerTypeScriptPluginKey, type: 'file' })

      const typePath = this.context.pluginManager.resolvePath({
        baseName: operationName || typeFileName,
        pluginKey: swaggerTypeScriptPluginKey,
        options: { tag: operation?.getTags()[0]?.name },
      })

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

    texts.push(fakerOutput)

    return [...this.extraTexts, ...texts]
  }
}
