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
    name: string
    tree: Array<Schema>
    value: SchemaObject
  }
}

export type Generator<TOptions extends PluginFactoryOptions> = CoreGenerator<TOptions> | ReactGenerator<TOptions>
