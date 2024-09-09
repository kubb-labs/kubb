import type { PluginFactoryOptions } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'
import type { Operation, SchemaObject } from '@kubb/oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App, createRoot } from '@kubb/react'
import type { KubbNode } from '@kubb/react/types'
import type { OperationGenerator } from './OperationGenerator.ts'
import type { SchemaGenerator, SchemaGeneratorOptions } from './SchemaGenerator.ts'
import type { Schema } from './SchemaMapper.ts'
import type { OperationsByMethod } from './types.ts'

type OperationsProps<TOptions extends PluginFactoryOptions> = {
  instance: Omit<OperationGenerator<TOptions>, 'build'>
  options: TOptions['resolvedOptions']
  operations: Array<Operation>
  operationsByMethod: OperationsByMethod
}

type OperationProps<TOptions extends PluginFactoryOptions> = {
  instance: Omit<OperationGenerator<TOptions>, 'build'>
  options: TOptions['resolvedOptions']
  operation: Operation
}

type SchemaProps<TOptions extends PluginFactoryOptions> = {
  instance: Omit<SchemaGenerator<SchemaGeneratorOptions, TOptions>, 'build'>
  schema: {
    name: string
    tree: Array<Schema>
    value: SchemaObject
  }
  options: TOptions['resolvedOptions']
}

export type GeneratorOptions<TOptions extends PluginFactoryOptions> = {
  name: string
  operations?: (this: GeneratorOptions<TOptions>, props: OperationsProps<TOptions>) => Promise<KubbFile.File[]>
  operation?: (this: GeneratorOptions<TOptions>, props: OperationProps<TOptions>) => Promise<KubbFile.File[]>
  schema?: (this: GeneratorOptions<TOptions>, props: SchemaProps<TOptions>) => Promise<KubbFile.File[]>
}

export type Generator<TOptions extends PluginFactoryOptions> = GeneratorOptions<TOptions>

export function createGenerator<TOptions extends PluginFactoryOptions>(parseOptions: GeneratorOptions<TOptions>): Generator<TOptions> {
  return parseOptions
}

export type ReactGeneratorOptions<TOptions extends PluginFactoryOptions> = {
  name: string
  Operations?: (this: ReactGeneratorOptions<TOptions>, props: OperationsProps<TOptions>) => KubbNode
  Operation?: (this: ReactGeneratorOptions<TOptions>, props: OperationProps<TOptions>) => KubbNode
  Schema?: (this: ReactGeneratorOptions<TOptions>, props: SchemaProps<TOptions>) => KubbNode
  /**
   * Combine all react nodes and only render ones(to string or render)
   */
  render?: () => any
}

export function createReactGenerator<TOptions extends PluginFactoryOptions>(parseOptions: ReactGeneratorOptions<TOptions>): Generator<TOptions> {
  return {
    ...parseOptions,
    async operations({ instance, options, operations, operationsByMethod }) {
      if (!parseOptions.Operations) {
        return []
      }

      const { pluginManager, oas, plugin, mode } = instance.context
      const root = createRoot({
        logger: pluginManager.logger,
      })

      const Component = parseOptions.Operations.bind(this)

      root.render(
        <App pluginManager={pluginManager} plugin={plugin} mode={mode}>
          <Oas oas={oas} operations={operations} generator={instance}>
            <Component operations={operations} instance={instance} operationsByMethod={operationsByMethod} options={options} />
          </Oas>
        </App>,
      )

      return root.files
    },
    async operation({ instance, operation, options }) {
      if (!parseOptions.Operation) {
        return []
      }

      const { pluginManager, oas, plugin, mode } = instance.context
      const root = createRoot({
        logger: pluginManager.logger,
      })

      const Component = parseOptions.Operation.bind(this)

      root.render(
        <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
          <Oas oas={oas} operations={[operation]} generator={instance}>
            <Oas.Operation operation={operation}>
              <Component operation={operation} options={options} instance={instance} />
            </Oas.Operation>
          </Oas>
        </App>,
      )

      return root.files
    },
    async schema({ instance, schema, options }) {
      if (!parseOptions.Schema) {
        return []
      }

      const { pluginManager, oas, plugin, mode } = instance.context
      const root = createRoot({
        logger: pluginManager.logger,
      })

      const Component = parseOptions.Schema.bind(this)

      root.render(
        <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
          <Oas oas={oas}>
            <Oas.Schema name={schema.name} value={schema.value} tree={schema.tree}>
              <Component schema={schema} options={options} instance={instance} />
            </Oas.Schema>
          </Oas>
        </App>,
      )

      return root.files
    },
  }
}
