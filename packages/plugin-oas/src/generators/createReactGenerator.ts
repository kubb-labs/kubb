import type { PluginFactoryOptions } from '@kubb/core'
import type { KubbNode } from '@kubb/react-fabric/types'
import type { OperationProps, OperationsProps, SchemaProps } from './types.ts'

type UserGenerator<TOptions extends PluginFactoryOptions> = {
  name: string
  Operations?: (props: OperationsProps<TOptions>) => KubbNode
  Operation?: (props: OperationProps<TOptions>) => KubbNode
  Schema?: (props: SchemaProps<TOptions>) => KubbNode
}

export type ReactGenerator<TOptions extends PluginFactoryOptions> = {
  name: string
  type: 'react'
  Operations: (props: OperationsProps<TOptions>) => KubbNode
  Operation: (props: OperationProps<TOptions>) => KubbNode
  Schema: (props: SchemaProps<TOptions>) => KubbNode
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
