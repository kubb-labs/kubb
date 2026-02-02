export { BaseGenerator } from './BaseGenerator.ts'
export { build, build as default, safeBuild, setup } from './build.ts'
export { type CLIOptions, defineConfig, isInputPath } from './config.ts'
export { defineLogger } from './defineLogger.ts'
export { definePlugin } from './definePlugin.ts'
export { PackageManager } from './PackageManager.ts'
export { getMode, PluginManager } from './PluginManager.ts'
export { PromiseManager } from './PromiseManager.ts'
// Resolver registry exports
export {
  defaultNameResolver,
  defaultPathResolver,
  getNameResolver,
  getPathResolver,
  hasNameResolver,
  hasPathResolver,
  type NameResolver,
  type PathResolver,
  type PathResolverContext,
  type PathResolverOptions,
  registerNameResolver,
  registerPathResolver,
  resolveNameWithRegistry,
  resolvePathWithRegistry,
} from './ResolverRegistry.ts'
export * from './types.ts'
export type { FileMetaBase } from './utils/getBarrelFiles.ts'
export { getBarrelFiles } from './utils/getBarrelFiles.ts'
