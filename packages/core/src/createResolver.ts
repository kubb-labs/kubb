import { camelCase, pascalCase } from '@internals/utils'
import { isOperationNode, isSchemaNode } from '@kubb/ast'
import type { Node, OperationNode, SchemaNode } from '@kubb/ast/types'
import type { PluginFactoryOptions, ResolveNameParams, ResolveOptionsContext } from './types.ts'

type ResolverBuilder<T extends PluginFactoryOptions> = () => Omit<T['resolver'], 'default' | 'resolveOptions'> &
  Partial<Pick<T['resolver'], 'default' | 'resolveOptions'>> &
  ThisType<T['resolver']>

function matchesOperationPattern(node: OperationNode, type: string, pattern: string | RegExp): boolean {
  switch (type) {
    case 'tag':
      return node.tags.some((tag) => !!tag.match(pattern))
    case 'operationId':
      return !!node.operationId.match(pattern)
    case 'path':
      return !!node.path.match(pattern)
    case 'method':
      return !!(node.method.toLowerCase() as string).match(pattern)
    default:
      return false
  }
}

function matchesSchemaPattern(node: SchemaNode, type: string, pattern: string | RegExp): boolean | null {
  switch (type) {
    case 'schemaName':
      return node.name ? !!node.name.match(pattern) : false
    default:
      return null
  }
}

function defaultResolver(name: ResolveNameParams['name'], type: ResolveNameParams['type']): string {
  let resolvedName = camelCase(name)

  if (type === 'file' || type === 'function') {
    resolvedName = camelCase(name, {
      isFile: type === 'file',
    })
  }

  if (type === 'type') {
    resolvedName = pascalCase(name)
  }

  return resolvedName
}

export function defaultResolveOptions<TOptions>(
  node: Node,
  { options, exclude = [], include, override = [] }: ResolveOptionsContext<TOptions>,
): TOptions | null {
  if (isOperationNode(node)) {
    const isExcluded = exclude.some(({ type, pattern }) => matchesOperationPattern(node, type, pattern))
    if (isExcluded) {
      return null
    }

    if (include && !include.some(({ type, pattern }) => matchesOperationPattern(node, type, pattern))) {
      return null
    }

    const overrideOptions = override.find(({ type, pattern }) => matchesOperationPattern(node, type, pattern))?.options

    return { ...options, ...overrideOptions }
  }

  if (isSchemaNode(node)) {
    if (exclude.some(({ type, pattern }) => matchesSchemaPattern(node, type, pattern) === true)) {
      return null
    }

    if (include) {
      const results = include.map(({ type, pattern }) => matchesSchemaPattern(node, type, pattern))
      const applicable = results.filter((r) => r !== null)
      if (applicable.length > 0 && !applicable.includes(true)) {
        return null
      }
    }

    const overrideOptions = override.find(({ type, pattern }) => matchesSchemaPattern(node, type, pattern) === true)?.options

    return { ...options, ...overrideOptions }
  }

  return options
}

export function createResolver<T extends PluginFactoryOptions>(build: ResolverBuilder<T>): T['resolver'] {
  return {
    default: defaultResolver,
    resolveOptions: defaultResolveOptions,
    ...build(),
  } as T['resolver']
}
