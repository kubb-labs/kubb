import { SchemaGenerator } from '@kubb/swagger'
import { pluginKey as swaggerTypeScriptPluginKey } from '@kubb/swagger-ts'

import { pluginKey } from './plugin.ts'
import { typeParser } from './typeParser.ts'

import type { SchemaGeneratorBuildOptions, SchemaGeneratorOptions } from '@kubb/swagger'

type Options = SchemaGeneratorOptions & {
  optionalType: 'questionToken' | 'undefined' | 'questionTokenAndUndefined'
  oasType: 'infer' | false
}

export class TypeGenerator extends SchemaGenerator<Options> {
  build({
    schema,
    name: baseName,
    keysToOmit,
    description,
  }: SchemaGeneratorBuildOptions): string[] {
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
