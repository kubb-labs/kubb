import path from 'node:path'
import type { KubbFile } from '@kubb/fabric-core/types'
import { camelCase, pascalCase } from './transformers/casing.ts'
import type { Group, ResolveNameParams } from './types.ts'

/**
 * Resolver function type for name resolution
 */
export type NameResolver = (name: string, type?: ResolveNameParams['type']) => string

/**
 * Path resolver options
 */
export type PathResolverOptions = {
  group?: {
    tag?: string
    path?: string
  }
}

/**
 * Path resolver context
 */
export type PathResolverContext = {
  root: string
  outputPath: string
  group?: Group
}

/**
 * Resolver function type for path resolution
 */
export type PathResolver = (baseName: string, mode: KubbFile.Mode | undefined, options: PathResolverOptions | undefined, ctx: PathResolverContext) => string

/**
 * Registry of name resolvers by plugin name
 */
const nameResolverRegistry = new Map<string, NameResolver>()

/**
 * Registry of path resolvers by plugin name
 */
const pathResolverRegistry = new Map<string, PathResolver>()

/**
 * Register a name resolver for a plugin
 */
export function registerNameResolver(pluginName: string, resolver: NameResolver): void {
  nameResolverRegistry.set(pluginName, resolver)
}

/**
 * Get a name resolver for a plugin
 */
export function getNameResolver(pluginName: string): NameResolver | undefined {
  return nameResolverRegistry.get(pluginName)
}

/**
 * Check if a plugin has a name resolver registered
 */
export function hasNameResolver(pluginName: string): boolean {
  return nameResolverRegistry.has(pluginName)
}

/**
 * Register a path resolver for a plugin
 */
export function registerPathResolver(pluginName: string, resolver: PathResolver): void {
  pathResolverRegistry.set(pluginName, resolver)
}

/**
 * Get a path resolver for a plugin
 */
export function getPathResolver(pluginName: string): PathResolver | undefined {
  return pathResolverRegistry.get(pluginName)
}

/**
 * Check if a plugin has a path resolver registered
 */
export function hasPathResolver(pluginName: string): boolean {
  return pathResolverRegistry.has(pluginName)
}

/**
 * Default name resolver - uses camelCase for functions, PascalCase for types
 */
export const defaultNameResolver: NameResolver = (name, type) => {
  if (type === 'type') {
    return pascalCase(name, { isFile: false })
  }
  if (type === 'file') {
    return pascalCase(name, { isFile: true })
  }
  return camelCase(name, { isFile: false })
}

/**
 * Default path resolver - uses standard path resolution with grouping support
 */
export const defaultPathResolver: PathResolver = (baseName, mode, options, ctx) => {
  if (mode === 'single') {
    return path.resolve(ctx.root, ctx.outputPath)
  }

  if (ctx.group && (options?.group?.path || options?.group?.tag)) {
    const groupName: Group['name'] = ctx.group?.name
      ? ctx.group.name
      : (groupCtx) => {
          if (ctx.group?.type === 'path') {
            return `${groupCtx.group.split('/')[1]}`
          }
          return `${camelCase(groupCtx.group)}Controller`
        }

    return path.resolve(
      ctx.root,
      ctx.outputPath,
      groupName({
        group: ctx.group.type === 'path' ? options.group!.path! : options.group!.tag!,
      }),
      baseName,
    )
  }

  return path.resolve(ctx.root, ctx.outputPath, baseName)
}

/**
 * Resolve a name using the registered resolver or default
 */
export function resolveNameWithRegistry(pluginName: string, name: string, type?: ResolveNameParams['type']): string {
  const resolver = getNameResolver(pluginName)
  if (resolver) {
    return resolver(name, type)
  }
  return defaultNameResolver(name, type)
}

/**
 * Resolve a path using the registered resolver or default
 */
export function resolvePathWithRegistry(
  pluginName: string,
  baseName: string,
  mode: KubbFile.Mode | undefined,
  options: PathResolverOptions | undefined,
  ctx: PathResolverContext,
): string {
  const resolver = getPathResolver(pluginName)
  if (resolver) {
    return resolver(baseName, mode, options, ctx)
  }
  return defaultPathResolver(baseName, mode, options, ctx)
}
