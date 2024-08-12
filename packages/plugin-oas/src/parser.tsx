import type { FileMetaBase, Plugin, PluginFactoryOptions, ResolveNameParams } from '@kubb/core'
import type { Operation, SchemaObject } from '@kubb/oas'
import { type KubbNode, useApp, useContext } from '@kubb/react'
import type * as KubbFile from '@kubb/fs/types'
import type { OperationsByMethod, OperationSchemas } from './types.ts'
import { useOperation, useOperationManager, useOperations } from '@kubb/plugin-oas/hooks'
import { Oas } from '@kubb/plugin-oas/components'

type FileMeta = FileMetaBase & {
  pluginKey: Plugin['key']
  name: string
  tag?: string
}

type OperationHelpers<TOptions extends PluginFactoryOptions> = {
  getName: (props: {
    type: NonNullable<ResolveNameParams['type']>
    /**
     * @default current parser
     */
    parser?: Parser<any>
  }) => string
  getFile: (props?: {
    /**
     * @default current parser
     */
    parser?: Parser<any>
    extName?: KubbFile.Extname
  }) => KubbFile.File<FileMeta>
  getSchemas: (props?: {
    type?: NonNullable<ResolveNameParams['type']>
    /**
     * @default current parser
     */
    parser?: Parser<any>
    forStatusCode?: string | number
  }) => OperationSchemas
}

type OperationsProps<TOptions extends PluginFactoryOptions> = {
  options: TOptions['resolvedOptions']
  operations: Array<Operation>
  operationsByMethod: OperationsByMethod
}

type OperationProps<TOptions extends PluginFactoryOptions> = {
  options: TOptions['resolvedOptions']
  operation: Operation
}

type SchemaProps<TOptions extends PluginFactoryOptions> = {
  children?: KubbNode
}

type Transform = (schema: SchemaObject, meta: any) => any

type PostTransform = (ast: any) => any

export type ParserOptions<TOptions extends PluginFactoryOptions> = {
  name: string
  pluginName: TOptions['name']

  /**
   * Override the default Schema Object ➝ TypeScript transformer in certain scenarios
   */
  transform?: Transform
  /**
   * Same as transform but runs after the TypeScript transformation
   * @link https://openapi-ts.dev/node#transform-posttransform
   */
  postTransform?: PostTransform
  templates?: {
    Operations?: (props: OperationsProps<TOptions>) => KubbNode
    Operation?: (props: OperationProps<TOptions> & OperationHelpers<TOptions>) => KubbNode
    Schema?: (props: SchemaProps<TOptions>) => KubbNode
  }
}

export type Parser<TOptions extends PluginFactoryOptions> = {
  name: string
  pluginName: string
  /**
   * Override the default Schema Object ➝ TypeScript transformer in certain scenarios
   */
  transform?: Transform
  /**
   * Same as transform but runs after the TypeScript transformation
   * @link https://openapi-ts.dev/node#transform-posttransform
   */
  postTransform?: PostTransform
  templates: {
    Operations: (props: {}) => KubbNode
    Operation: (props: {}) => KubbNode
    Schema: (props: {}) => KubbNode
  }
}

export function createParser<TOptions extends PluginFactoryOptions>(options: ParserOptions<TOptions>): Parser<TOptions> {
  return {
    ...options,
    templates: {
      Operations(props) {
        const Component = options.templates?.Operations

        const { operations = [], operationsByMethod = {} } = useContext(Oas.Context)
        const { plugin } = useApp<TOptions>()

        if (Component) {
          return <Component options={plugin.options} operations={operations} operationsByMethod={operationsByMethod} {...props} />
        }

        return null
      },
      Operation(props) {
        const Component = options.templates?.Operation

        const operationManager = useOperationManager()
        const operation = useOperation()
        const { plugin } = useApp<TOptions>()

        const getName: OperationHelpers<TOptions>['getName'] = ({ parser, type }) => {
          return operationManager.getName(operation, { type, pluginKey: [parser?.pluginName || options.pluginName] })
        }

        const getFile: OperationHelpers<TOptions>['getFile'] = ({ parser, extName } = {}) => {
          return operationManager.getFile(operation, {
            name: operationManager.getName(operation, { type: 'file', pluginKey: [parser?.pluginName || options.pluginName] }),
            pluginKey: [parser?.pluginName || options.pluginName],
            extName,
          })
        }

        const getSchemas: OperationHelpers<TOptions>['getSchemas'] = ({ parser, type, forStatusCode } = {}) => {
          return operationManager.getSchemas(
            operation,
            {
              type,
              pluginKey: [parser?.pluginName || options.pluginName],
            },
            forStatusCode,
          )
        }

        if (Component) {
          return <Component options={plugin.options} operation={operation} getName={getName} getFile={getFile} getSchemas={getSchemas} {...props} />
        }

        return null
      },
      Schema(props) {
        const Component = options.templates?.Schema

        if (Component) {
          return <Component {...props} />
        }

        return null
      },
    },
  }
}
