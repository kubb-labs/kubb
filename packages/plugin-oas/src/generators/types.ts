import type { PluginFactoryOptions } from '@kubb/core'
import type { Operation, SchemaObject } from '@kubb/oas'
import type { OperationGenerator, Schema, SchemaGenerator, SchemaGeneratorOptions } from '@kubb/plugin-oas'
import type { CoreGenerator } from './createGenerator.ts'
import type { ReactGenerator } from './createReactGenerator.ts'

export type OperationsProps<TOptions extends PluginFactoryOptions> = {
  /**
   * @deprecated
   */
  instance: Omit<OperationGenerator<TOptions>, 'build'>
  options: TOptions['resolvedOptions']
  operations: Array<Operation>
}

export type OperationProps<TOptions extends PluginFactoryOptions> = {
  /**
   * @deprecated
   */
  instance: Omit<OperationGenerator<TOptions>, 'build'>
  options: TOptions['resolvedOptions']
  operation: Operation
}

export type SchemaProps<TOptions extends PluginFactoryOptions> = {
  instance: Omit<SchemaGenerator<SchemaGeneratorOptions, TOptions>, 'build'>
  options: TOptions['resolvedOptions']
  schema: {
    name: string
    tree: Array<Schema>
    value: SchemaObject
  }
}

export type Generator<TOptions extends PluginFactoryOptions> = CoreGenerator<TOptions> | ReactGenerator<TOptions>
