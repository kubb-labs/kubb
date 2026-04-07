import type { PluginFactoryOptions } from '@kubb/core'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { OperationProps, OperationsProps, SchemaProps } from './types.ts'

type UserGenerator<TOptions extends PluginFactoryOptions> = {
  name: string
  Operations?: (props: OperationsProps<TOptions>) => KubbReactNode
  Operation?: (props: OperationProps<TOptions>) => KubbReactNode
  Schema?: (props: SchemaProps<TOptions>) => KubbReactNode
}

export type ReactGenerator<TOptions extends PluginFactoryOptions> = {
  name: string
  type: 'react'
  version: '1'
  Operations: (props: OperationsProps<TOptions>) => KubbReactNode
  Operation: (props: OperationProps<TOptions>) => KubbReactNode
  Schema: (props: SchemaProps<TOptions>) => KubbReactNode
}

/****
 * Creates a generator that uses React component functions to generate files for OpenAPI operations and schemas.
 *
 * The returned generator exposes async methods for generating files from operations, a single operation, or a schema, using the corresponding React components if provided. If a component is not defined, the method returns an empty array.
 *
 * @returns A generator object with async methods for operations, operation, and schema file generation.
 */
export function createReactGenerator<TOptions extends PluginFactoryOptions>(generator: UserGenerator<TOptions>): ReactGenerator<TOptions> {
  return {
    type: 'react',
    version: '1',
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
