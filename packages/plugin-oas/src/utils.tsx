import type { Config, Plugin, PluginFactoryOptions } from '@kubb/core'
import type { Operation, SchemaObject } from '@kubb/oas'
import { App, createReactFabric, type Fabric } from '@kubb/react-fabric'
import type { ReactGenerator } from './generators/createReactGenerator.ts'
import type { OperationGenerator } from './OperationGenerator.ts'
import type { SchemaGenerator, SchemaGeneratorOptions } from './SchemaGenerator.ts'
import type { Schema } from './SchemaMapper.ts'

type BuildOperationsOptions<TOptions extends PluginFactoryOptions> = {
  config: Config
  fabric: Fabric
  Component: ReactGenerator<any>['Operations']
  generator: Omit<OperationGenerator<TOptions>, 'build'>
  plugin: Plugin<TOptions>
}

export async function buildOperations<TOptions extends PluginFactoryOptions>(
  operations: Array<Operation>,
  { config, fabric, plugin, generator, Component }: BuildOperationsOptions<TOptions>,
): Promise<void> {
  if (!Component) {
    return undefined
  }

  const { pluginManager, oas, mode } = generator.context

  const fabricChild = createReactFabric()
  await fabricChild.render(() => {
    return (
      <App meta={{ pluginManager, plugin, mode, oas }}>
        <Component config={config} operations={operations} generator={generator} plugin={plugin} />
      </App>
    )
  })

  await fabric.context.fileManager.upsert(...fabricChild.files)
}

type BuildOperationOptions<TOptions extends PluginFactoryOptions> = {
  config: Config
  fabric: Fabric
  Component: ReactGenerator<any>['Operation']
  generator: Omit<OperationGenerator<TOptions>, 'build'>
  plugin: Plugin<TOptions>
  fabricChild?: Fabric
}

export async function buildOperation<TOptions extends PluginFactoryOptions>(
  operation: Operation,
  { config, fabric, plugin, generator, Component, fabricChild: sharedFabric }: BuildOperationOptions<TOptions>,
): Promise<void> {
  if (!Component) {
    return undefined
  }

  const { pluginManager, oas, mode } = generator.context

  const fabricChild = sharedFabric || createReactFabric()
  await fabricChild.render(() => {
    return (
      <App meta={{ pluginManager, plugin, mode, oas }}>
        <Component config={config} operation={operation} plugin={plugin} generator={generator} />
      </App>
    )
  })

  if (!sharedFabric) {
    await fabric.context.fileManager.upsert(...fabricChild.files)
  }
}

type BuildSchemaOptions<TOptions extends PluginFactoryOptions> = {
  config: Config
  fabric: Fabric
  Component: ReactGenerator<any>['Schema']
  generator: Omit<SchemaGenerator<SchemaGeneratorOptions, TOptions>, 'build'>
  plugin: Plugin<TOptions>
  fabricChild?: Fabric
}

export async function buildSchema<TOptions extends PluginFactoryOptions>(
  schema: {
    name: string
    tree: Array<Schema>
    value: SchemaObject
  },
  { config, fabric, plugin, Component, generator, fabricChild: sharedFabric }: BuildSchemaOptions<TOptions>,
): Promise<void> {
  if (!Component) {
    return undefined
  }

  const { pluginManager, oas, mode } = generator.context

  const fabricChild = sharedFabric || createReactFabric()
  await fabricChild.render(() => {
    return (
      <App meta={{ pluginManager, plugin, mode, oas }}>
        <Component config={config} schema={schema} plugin={plugin} generator={generator} />
      </App>
    )
  })

  if (!sharedFabric) {
    await fabric.context.fileManager.upsert(...fabricChild.files)
  }
}
