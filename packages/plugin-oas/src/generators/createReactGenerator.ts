import type { PluginFactoryOptions } from '@kubb/core'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type { OperationProps, OperationsProps, SchemaProps, Version } from './types.ts'

type UserGenerator<TOptions extends PluginFactoryOptions, TVersion extends Version> = {
  name: string
  version?: TVersion
  Operations?: (props: OperationsProps<TOptions, TVersion>) => FabricReactNode
  Operation?: (props: OperationProps<TOptions, TVersion>) => FabricReactNode
  Schema?: (props: SchemaProps<TOptions, TVersion>) => FabricReactNode
}

export type ReactGenerator<TOptions extends PluginFactoryOptions, TVersion extends Version> = {
  name: string
  type: 'react'
  version: TVersion
  Operations: (props: OperationsProps<TOptions, TVersion>) => FabricReactNode
  Operation: (props: OperationProps<TOptions, TVersion>) => FabricReactNode
  Schema: (props: SchemaProps<TOptions, TVersion>) => FabricReactNode
}

/****
 * Creates a generator that uses React component functions to generate files for OpenAPI operations and schemas.
 *
 * The returned generator exposes async methods for generating files from operations, a single operation, or a schema, using the corresponding React components if provided. If a component is not defined, the method returns an empty array.
 *
 * @returns A generator object with async methods for operations, operation, and schema file generation.
 */
export function createReactGenerator<TOptions extends PluginFactoryOptions, TVersion extends Version = '1'>(
  generator: UserGenerator<TOptions, TVersion>,
): ReactGenerator<TOptions, TVersion> {
  return {
    type: 'react',
    version: (generator.version ?? '1') as TVersion,
    Operations() {
      return null
    },
    Operation() {
      return null
    },
    Schema() {
      return null
    },
    ...generator,
  }
}
