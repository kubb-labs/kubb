import type { OperationNode, SchemaNode } from '@kubb/ast/types'
import type { Config, Plugin, PluginFactoryOptions } from '@kubb/core'
import type { Operation, SchemaObject } from '@kubb/oas'
import type { OperationGenerator } from '../OperationGenerator.ts'
import type { SchemaGenerator, SchemaGeneratorOptions } from '../SchemaGenerator.ts'
import type { Schema } from '../SchemaMapper.ts'
import type { CoreGenerator } from './createGenerator.ts'
import type { ReactGenerator } from './createReactGenerator.ts'

export type Version = '1' | '2'

export type OperationsV1Props<TOptions extends PluginFactoryOptions> = {
  config: Config
  generator: Omit<OperationGenerator<TOptions>, 'build'>
  plugin: Plugin<TOptions>
  operations: Array<Operation>
}

export type OperationsV2Props<TOptions extends PluginFactoryOptions> = {
  config: Config
  plugin: Plugin<TOptions>
  nodes: Array<OperationNode>
}

export type OperationV1Props<TOptions extends PluginFactoryOptions> = {
  config: Config
  generator: Omit<OperationGenerator<TOptions>, 'build'>
  plugin: Plugin<TOptions>
  operation: Operation
}

export type OperationV2Props<TOptions extends PluginFactoryOptions> = {
  config: Config
  plugin: Plugin<TOptions>
  node: OperationNode
}

export type OperationsProps<TOptions extends PluginFactoryOptions, TVersion extends Version = '1'> = TVersion extends '2'
  ? OperationsV2Props<TOptions>
  : OperationsV1Props<TOptions>

export type OperationProps<TOptions extends PluginFactoryOptions, TVersion extends Version = '1'> = TVersion extends '2'
  ? OperationV2Props<TOptions>
  : OperationV1Props<TOptions>

export type SchemaV1Props<TOptions extends PluginFactoryOptions> = {
  config: Config
  generator: Omit<SchemaGenerator<SchemaGeneratorOptions, TOptions>, 'build'>
  plugin: Plugin<TOptions>
  schema: {
    name: string
    tree: Array<Schema>
    value: SchemaObject
  }
}

export type SchemaV2Props<TOptions extends PluginFactoryOptions> = {
  config: Config
  plugin: Plugin<TOptions>
  node: SchemaNode
}

export type SchemaProps<TOptions extends PluginFactoryOptions, TVersion extends Version = '1'> = TVersion extends '2'
  ? SchemaV2Props<TOptions>
  : SchemaV1Props<TOptions>

export type Generator<TOptions extends PluginFactoryOptions, TVersion extends Version = Version> =
  | CoreGenerator<TOptions, TVersion>
  | ReactGenerator<TOptions, TVersion>
