import type { Plugin, PluginFactoryOptions, PluginManager } from '@kubb/core'
import { BaseGenerator, type FileMetaBase } from '@kubb/core'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { contentType, Oas } from '@kubb/oas'
import type { Fabric } from '@kubb/react-fabric'
import type { Generator as OasSubGenerator } from './generators/types.ts'
import { OperationGenerator } from './OperationGenerator.ts'
import { SchemaGenerator, type SchemaGeneratorOptions } from './SchemaGenerator.ts'
import type { Exclude, Include, Override } from './types.ts'

/**
 * Unified OAS Generator that orchestrates both SchemaGenerator and OperationGenerator
 * so plugins only need a single call to generate all related files.
 */
export class Generator<TPluginOptions extends PluginFactoryOptions = PluginFactoryOptions, TFileMeta extends FileMetaBase = FileMetaBase> extends BaseGenerator<
  TPluginOptions['resolvedOptions'],
  {
    fabric: Fabric
    oas: Oas
    pluginManager: PluginManager
    plugin: Plugin<TPluginOptions>
    mode: KubbFile.Mode
    // OperationGenerator specific
    exclude?: Array<Exclude>
    include?: Array<Include>
    override?: Array<Override<TPluginOptions['resolvedOptions']>>
    contentType?: contentType
    // SchemaGenerator specific
    output?: string // when provided, schema generation will run
  }
> {
  async build(...generators: Array<OasSubGenerator<TPluginOptions>>): Promise<Array<KubbFile.File>> {
    const files: Array<KubbFile.File> = []

    // Run Schema generation when output is provided
    if (this.context.output) {
      const schemaGen = new SchemaGenerator(this.options as unknown as SchemaGeneratorOptions, {
        fabric: this.context.fabric,
        oas: this.context.oas,
        pluginManager: this.context.pluginManager,
        plugin: this.context.plugin,
        contentType: this.context.contentType,
        include: undefined,
        override: this.context.override,
        mode: this.context.mode,
        output: this.context.output,
      })

      const schemaFiles = await schemaGen.build(...generators)
      if (schemaFiles) {
        files.push(...schemaFiles)
      }
    }

    // Always run Operation generation
    const opGen = new OperationGenerator<TPluginOptions, TFileMeta>(this.options, {
      fabric: this.context.fabric,
      oas: this.context.oas,
      pluginManager: this.context.pluginManager,
      plugin: this.context.plugin,
      contentType: this.context.contentType,
      exclude: this.context.exclude,
      include: this.context.include,
      override: this.context.override,
      mode: this.context.mode,
    })

    const opFiles = await opGen.build(...generators)
    if (opFiles) {
      files.push(...opFiles)
    }

    return files
  }
}
