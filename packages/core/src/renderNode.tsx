import type { OperationNode, SchemaNode } from '@kubb/ast/types'
import { createReactFabric, Fabric } from '@kubb/react-fabric'
import type { Fabric as FabricType } from '@kubb/react-fabric/types'
import type { PluginDriver } from './PluginDriver.ts'
import type { Adapter, Config, Exclude, Generator, Include, Override, Plugin, PluginFactoryOptions, ReactGeneratorV2 } from './types.ts'

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

/**
 * Shared context passed to every `runGenerator*` helper.
 * Contains everything a generator needs to produce and write files.
 */
type RunGeneratorContext<TOptions extends PluginFactoryOptions> = {
  generators: Array<Generator<TOptions>>
  plugin: Plugin<TOptions>
  resolver: TOptions['resolver']
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<TOptions['resolvedOptions']>>
  fabric: FabricType
  adapter: Adapter
  config: Config
  driver: PluginDriver
}

/**
 * Dispatches a single schema node to all generators (react + core).
 * Resolves options per generator and skips excluded nodes.
 */
export async function runGeneratorSchema<TOptions extends PluginFactoryOptions>(node: SchemaNode, ctx: RunGeneratorContext<TOptions>): Promise<void> {
  const { generators, plugin, resolver, exclude, include, override, fabric, adapter, config, driver } = ctx

  await Promise.all(
    generators.map(async (generator) => {
      const options = resolver.resolveOptions(node, { options: plugin.options, exclude, include, override })

      if (options === null) {
        return
      }

      if (generator.type === 'react' && generator.version === '2') {
        await renderSchema(node, { options, resolver, adapter, config, fabric, Component: generator.Schema, plugin, driver })
      }

      if (generator.type === 'core' && generator.version === '2') {
        const files = (await generator.schema?.({ node, options, resolver, adapter, config, plugin, driver })) ?? []
        await fabric.upsertFile(...files)
      }
    }),
  )
}

/**
 * Dispatches a single operation node to all generators (react + core).
 * Resolves options per generator and skips excluded nodes.
 */
export async function runGeneratorOperation<TOptions extends PluginFactoryOptions>(node: OperationNode, ctx: RunGeneratorContext<TOptions>): Promise<void> {
  const { generators, plugin, resolver, exclude, include, override, fabric, adapter, config, driver } = ctx

  await Promise.all(
    generators.map(async (generator) => {
      const options = resolver.resolveOptions(node, { options: plugin.options, exclude, include, override })

      if (options === null) {
        return
      }

      if (generator.type === 'react' && generator.version === '2') {
        await renderOperation(node, { options, resolver, adapter, config, fabric, Component: generator.Operation, plugin, driver })
      }

      if (generator.type === 'core' && generator.version === '2') {
        const files = (await generator.operation?.({ node, options, resolver, adapter, config, plugin, driver })) ?? []
        await fabric.upsertFile(...files)
      }
    }),
  )
}

/**
 * Batch-dispatches all collected operation nodes to every generator (react + core).
 * Uses `plugin.options` directly — no per-node option resolution.
 */
export async function runGeneratorOperations<TOptions extends PluginFactoryOptions>(
  nodes: Array<OperationNode>,
  ctx: Omit<RunGeneratorContext<TOptions>, 'exclude' | 'include' | 'override'>,
): Promise<void> {
  const { generators, plugin, resolver, fabric, adapter, config, driver } = ctx

  await Promise.all(
    generators.map(async (generator) => {
      if (generator.type === 'react' && generator.version === '2') {
        await renderOperations(nodes, { options: plugin.options, resolver, adapter, config, fabric, Component: generator.Operations, plugin, driver })
      }

      if (generator.type === 'core' && generator.version === '2') {
        const files = (await generator.operations?.({ nodes, options: plugin.options, resolver, adapter, config, plugin, driver })) ?? []
        await fabric.upsertFile(...files)
      }
    }),
  )
}
