import type { FileNode } from '@kubb/ast'
import { getGeneratorContext } from './generatorContext.ts'
import type { PluginDriver } from './PluginDriver.ts'

export function useFiles(): Array<FileNode> {
  return getGeneratorContext().driver.fileManager.files
}

export function useDriver(): PluginDriver {
  return getGeneratorContext().driver
}
