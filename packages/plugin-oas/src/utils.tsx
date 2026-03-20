import type { Config, Plugin, PluginFactoryOptions } from '@kubb/core'
import type { Operation, SchemaObject } from '@kubb/oas'
import { createReactFabric, Fabric } from '@kubb/react-fabric'
import type { Fabric as FabricType } from '@kubb/react-fabric/types'
import type { ReactGenerator } from './generators/createReactGenerator.ts'
import type { OperationGenerator } from './OperationGenerator.ts'
import type { SchemaGenerator, SchemaGeneratorOptions } from './SchemaGenerator.ts'
import type { Schema } from './SchemaMapper.ts'

type BuildOperationsV1Options<TOptions extends PluginFactoryOptions> = {
  config: Config
  fabric: FabricType
  plugin: Plugin<TOptions>
  Component: ReactGenerator<TOptions>['Operations']
  generator: Omit<OperationGenerator<TOptions>, 'build'>
}

/**
 * Renders a React component for a list of operations (V1 generators).
 */
export async function renderOperations<TOptions extends PluginFactoryOptions>(
  operations: Array<Operation>,
  options: BuildOperationsV1Options<TOptions>,
): Promise<void> {
  const { config, fabric, plugin, Component, generator } = options

  if (!Component) {
    return undefined
  }

  const { driver, oas, mode } = generator.context
  const fabricChild = createReactFabric()

  await fabricChild.render(
    <Fabric meta={{ driver, plugin, mode, oas }}>
      <Component config={config} operations={operations} generator={generator} plugin={plugin} />
    </Fabric>,
  )

  fabric.context.fileManager.upsert(...fabricChild.files)
  fabricChild.unmount()
}

type BuildOperationV1Options<TOptions extends PluginFactoryOptions> = {
  config: Config
  fabric: FabricType
  plugin: Plugin<TOptions>
  Component: ReactGenerator<TOptions>['Operation']
  generator: Omit<OperationGenerator<TOptions>, 'build'>
}

/**
 * Renders a React component for a single operation (V1 generators).
 */
export async function renderOperation<TOptions extends PluginFactoryOptions>(operation: Operation, options: BuildOperationV1Options<TOptions>): Promise<void> {
  const { config, fabric, plugin, Component, generator } = options

  if (!Component) {
    return undefined
  }

  const { driver, oas, mode } = generator.context
  const fabricChild = createReactFabric()

  await fabricChild.render(
    <Fabric meta={{ driver, plugin, mode, oas }}>
      <Component config={config} operation={operation} plugin={plugin} generator={generator} />
    </Fabric>,
  )

  fabric.context.fileManager.upsert(...fabricChild.files)
  fabricChild.unmount()
}

type BuildSchemaV1Options<TOptions extends PluginFactoryOptions> = {
  config: Config
  fabric: FabricType
  plugin: Plugin<TOptions>
  Component: ReactGenerator<TOptions>['Schema']
  generator: Omit<SchemaGenerator<SchemaGeneratorOptions, TOptions>, 'build'>
}

/**
 * Renders a React component for a single schema (V1 generators).
 */
export async function renderSchema<TOptions extends PluginFactoryOptions>(
  schema: { name: string; tree: Array<Schema>; value: SchemaObject },
  options: BuildSchemaV1Options<TOptions>,
): Promise<void> {
  const { config, fabric, plugin, Component, generator } = options

  if (!Component) {
    return undefined
  }

  const { driver, oas, mode } = generator.context
  const fabricChild = createReactFabric()

  await fabricChild.render(
    <Fabric meta={{ driver, plugin, mode, oas }}>
      <Component config={config} schema={schema} plugin={plugin} generator={generator} />
    </Fabric>,
  )

  fabric.context.fileManager.upsert(...fabricChild.files)
  fabricChild.unmount()
}
