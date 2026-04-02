import path from 'node:path'
import { walk } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { PluginDriver } from './PluginDriver.ts'
import { renderHookResult } from './renderNode.tsx'
import type { Plugin, PluginContext } from './types.ts'
import { getBarrelFiles } from './utils/getBarrelFiles.ts'

/**
 * Centralized AST walk + generator dispatch + barrel file generation.
 *
 * Called automatically by `build.ts` when `plugin.generators` is non-empty.
 * Each generator's `schema`, `operation`, and `operations` methods are called with
 * `this = PluginContext`, giving generators full access to `this.resolver`,
 * `this.config`, `this.adapter`, `this.fabric`, etc.
 */
export async function runPluginGenerators(plugin: Plugin, context: PluginContext, _driver: PluginDriver): Promise<void> {
  const { config, fabric, adapter, rootNode, resolver } = context

  if (!adapter || !rootNode) {
    throw new Error(`[${plugin.name}] No adapter found. Add an OAS adapter (e.g. pluginOas()) before this plugin in your Kubb config.`)
  }

  const pluginOptions = plugin.options as Record<string, unknown>
  const output = pluginOptions['output'] as { path: string; barrelType?: string } | undefined
  const root = path.resolve(config.root, config.output.path)

  const exclude = (pluginOptions['exclude'] as [] | undefined) ?? []
  const include = pluginOptions['include'] as [] | undefined
  const override = (pluginOptions['override'] as [] | undefined) ?? []
  const generators = plugin.generators ?? []

  const collectedOperations: Array<OperationNode> = []

  await walk(rootNode, {
    depth: 'shallow',
    async schema(node) {
      for (const generator of generators) {
        if (!generator.schema) continue
        const options = resolver.resolveOptions(node, { options: plugin.options, exclude, include, override })
        if (options === null) continue
        const result = await generator.schema.call(context, node, options)
        await renderHookResult(result, fabric)
      }
    },
    async operation(node) {
      const options = resolver.resolveOptions(node, { options: plugin.options, exclude, include, override })
      if (options !== null) collectedOperations.push(node)

      for (const generator of generators) {
        if (!generator.operation) continue
        if (options === null) continue
        const result = await generator.operation.call(context, node, options)
        await renderHookResult(result, fabric)
      }
    },
  })

  for (const generator of generators) {
    if (!generator.operations) continue
    const result = await generator.operations.call(context, collectedOperations, plugin.options)
    await renderHookResult(result, fabric)
  }

  if (output?.barrelType) {
    const barrelFiles = await getBarrelFiles(fabric.files, {
      type: (output.barrelType ?? 'named') as 'named' | 'all' | 'propagate',
      root,
      output: output as Parameters<typeof getBarrelFiles>[1]['output'],
      meta: {
        pluginName: plugin.name,
      },
    })

    await context.upsertFile(...barrelFiles)
  }
}
