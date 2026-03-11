import type { SchemaNode } from '@internals/ast'
import type { Config, Plugin, PluginFactoryOptions } from '@kubb/core'
import type { Operation, SchemaObject } from '@kubb/oas'
import type { OperationGenerator } from '../OperationGenerator.ts'
import type { SchemaGenerator, SchemaGeneratorOptions } from '../SchemaGenerator.ts'
import type { Schema } from '../SchemaMapper.ts'
import type { CoreGenerator } from './createGenerator.ts'
import type { ReactGenerator } from './createReactGenerator.ts'

export type OperationsProps<TOptions extends PluginFactoryOptions> = {
  config: Config
  generator: Omit<OperationGenerator<TOptions>, 'build'>
  plugin: Plugin<TOptions>
  operations: Array<Operation>
}

export type OperationProps<TOptions extends PluginFactoryOptions> = {
  config: Config
  generator: Omit<OperationGenerator<TOptions>, 'build'>
  plugin: Plugin<TOptions>
  operation: Operation
}

export type SchemaProps<TOptions extends PluginFactoryOptions> = {
  config: Config
  generator: Omit<SchemaGenerator<SchemaGeneratorOptions, TOptions>, 'build'>
  plugin: Plugin<TOptions>
  schema: {
    /**
     * @deprecated will be replaced with schemaNode
     */
    name: string
    /**
     * @deprecated will be replaced with schemaNode
     */
    tree: Array<Schema>
    /**
     * @deprecated will be replaced with schemaNode
     */
    value: SchemaObject
    /**
     * The spec-agnostic AST node for this schema, populated from the kubb-parser stage.
     * Use this to generate code without coupling to OpenAPI/Swagger internals.
     */
    schemaNode: SchemaNode
  }
}

export type Generator<TOptions extends PluginFactoryOptions> = CoreGenerator<TOptions> | ReactGenerator<TOptions>
