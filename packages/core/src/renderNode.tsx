import type { OperationNode, SchemaNode } from '@kubb/ast/types'
import { createReactFabric, Fabric } from '@kubb/react-fabric'
import type { Fabric as FabricType } from '@kubb/react-fabric/types'
import type { PluginDriver } from './PluginDriver.ts'
import type { Adapter, Config, Plugin, PluginFactoryOptions, ReactGeneratorV2 } from './types.ts'

type BuildOperationsV2Options<TOptions extends PluginFactoryOptions> = {
  config: Config
  fabric: FabricType
  plugin: Plugin<TOptions>
  Component: ReactGeneratorV2<TOptions>['Operations'] | undefined
  adapter: Adapter
  driver: PluginDriver
  options: TOptions['resolvedOptions']
  resolver: TOptions['resolver']
}

/**
 * Renders a React component for a list of operation nodes (V2 generators).
 */
export async function renderOperations<TOptions extends PluginFactoryOptions>(
  nodes: Array<OperationNode>,
  options: BuildOperationsV2Options<TOptions>,
): Promise<void> {
  const { config, fabric, plugin, Component, driver, adapter } = options

  if (!Component) {
    return undefined
  }

  const fabricChild = createReactFabric()

  await fabricChild.render(
    <Fabric>
      <Component config={config} plugin={plugin} driver={driver} adapter={adapter} nodes={nodes} options={options.options} resolver={options.resolver} />
    </Fabric>,
  )

  fabric.context.fileManager.upsert(...fabricChild.files)
  fabricChild.unmount()
}

type BuildOperationV2Options<TOptions extends PluginFactoryOptions> = {
  config: Config
  fabric: FabricType
  plugin: Plugin<TOptions>
  Component: ReactGeneratorV2<TOptions>['Operation'] | undefined
  adapter: Adapter
  driver: PluginDriver
  options: TOptions['resolvedOptions']
  resolver: TOptions['resolver']
}

/**
 * Renders a React component for a single operation node (V2 generators).
 */
export async function renderOperation<TOptions extends PluginFactoryOptions>(node: OperationNode, options: BuildOperationV2Options<TOptions>): Promise<void> {
  const { config, fabric, plugin, Component, adapter, driver } = options

  if (!Component) {
    return undefined
  }

  const fabricChild = createReactFabric()

  await fabricChild.render(
    <Fabric>
      <Component config={config} plugin={plugin} driver={driver} adapter={adapter} node={node} options={options.options} resolver={options.resolver} />
    </Fabric>,
  )

  fabric.context.fileManager.upsert(...fabricChild.files)
  fabricChild.unmount()
}

type BuildSchemaV2Options<TOptions extends PluginFactoryOptions> = {
  config: Config
  fabric: FabricType
  plugin: Plugin<TOptions>
  Component: ReactGeneratorV2<TOptions>['Schema'] | undefined
  adapter: Adapter
  driver: PluginDriver
  options: TOptions['resolvedOptions']
  resolver: TOptions['resolver']
}

/**
 * Renders a React component for a single schema node (V2 generators).
 */
export async function renderSchema<TOptions extends PluginFactoryOptions>(node: SchemaNode, options: BuildSchemaV2Options<TOptions>): Promise<void> {
  const { config, fabric, plugin, Component, adapter, driver } = options

  if (!Component) {
    return undefined
  }

  const fabricChild = createReactFabric()

  await fabricChild.render(
    <Fabric>
      <Component config={config} plugin={plugin} driver={driver} adapter={adapter} node={node} options={options.options} resolver={options.resolver} />
    </Fabric>,
  )

  fabric.context.fileManager.upsert(...fabricChild.files)

  fabricChild.unmount()
}
