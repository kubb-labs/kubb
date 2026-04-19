/**
 * TypeScript ambient declarations for Kubb virtual modules.
 *
 * Add to your tsconfig.json to enable types for kubb:* imports:
 *   { "compilerOptions": { "types": ["@kubb/core/virtual-modules"] } }
 *
 * Or add a reference in a .d.ts file in your project:
 *   /// <reference types="@kubb/core/virtual-modules" />
 *
 * The virtual module loader must be registered for runtime use:
 *   node --import @kubb/core/register
 */

declare module 'kubb:files' {
  import type { FileNode } from '@kubb/ast'
  /**
   * Returns all files currently in the FileManager.
   * Must be called inside a generator schema(), operation(), or operations() method.
   */
  export const files: () => Array<FileNode>
}

declare module 'kubb:driver' {
  import type { PluginDriver } from '@kubb/core'
  /**
   * Returns the active PluginDriver instance.
   * Must be called inside a generator schema(), operation(), or operations() method.
   */
  export const driver: () => PluginDriver
}
