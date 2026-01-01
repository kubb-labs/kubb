/**
 * Output organization utilities
 * Inspired by Alloy's Output and SourceDirectory concepts
 *
 * Provides helpers for organizing generated files into directory structures
 */

import path from 'node:path'

/**
 * Represents a file to be generated
 */
export type OutputFile = {
  /**
   * Base name of the file (e.g., 'index.ts')
   */
  baseName: string
  /**
   * Full path to the file
   */
  path: string
  /**
   * Content of the file
   */
  content?: string
  /**
   * Metadata associated with the file
   */
  metadata?: Record<string, unknown>
}

/**
 * Represents a directory structure
 */
export type OutputDirectory = {
  /**
   * Directory path
   */
  path: string
  /**
   * Files in this directory
   */
  files: OutputFile[]
  /**
   * Subdirectories
   */
  subdirectories: OutputDirectory[]
  /**
   * Metadata associated with the directory
   */
  metadata?: Record<string, unknown>
}

/**
 * Output organizer for managing file and directory structure
 */
export class OutputOrganizer {
  private root: OutputDirectory

  constructor(rootPath = '.') {
    this.root = {
      path: rootPath,
      files: [],
      subdirectories: [],
    }
  }

  /**
   * Adds a file to the output
   */
  addFile(file: OutputFile): void {
    const dir = this.ensureDirectory(path.dirname(file.path))
    dir.files.push(file)
  }

  /**
   * Adds multiple files
   */
  addFiles(files: OutputFile[]): void {
    files.forEach((file) => this.addFile(file))
  }

  /**
   * Creates or gets a directory
   */
  ensureDirectory(dirPath: string): OutputDirectory {
    // Normalize the path
    const normalizedPath = path.normalize(dirPath)

    if (normalizedPath === '.' || normalizedPath === this.root.path) {
      return this.root
    }

    // Get relative path from root
    const relativePath = path.relative(this.root.path, normalizedPath)
    const parts = relativePath.split(path.sep).filter((p) => p && p !== '.')

    let current = this.root

    for (const part of parts) {
      let subdir = current.subdirectories.find((d) => path.basename(d.path) === part)

      if (!subdir) {
        const newPath = path.join(current.path, part)
        subdir = {
          path: newPath,
          files: [],
          subdirectories: [],
        }
        current.subdirectories.push(subdir)
      }

      current = subdir
    }

    return current
  }

  /**
   * Gets a directory by path
   */
  getDirectory(dirPath: string): OutputDirectory | undefined {
    const normalizedPath = path.normalize(dirPath)

    if (normalizedPath === '.' || normalizedPath === this.root.path) {
      return this.root
    }

    const relativePath = path.relative(this.root.path, normalizedPath)
    const parts = relativePath.split(path.sep).filter((p) => p && p !== '.')

    let current = this.root

    for (const part of parts) {
      const subdir = current.subdirectories.find((d) => path.basename(d.path) === part)
      if (!subdir) {
        return undefined
      }
      current = subdir
    }

    return current
  }

  /**
   * Gets all files in the output
   */
  getAllFiles(): OutputFile[] {
    const files: OutputFile[] = []

    const collectFiles = (dir: OutputDirectory) => {
      files.push(...dir.files)
      dir.subdirectories.forEach(collectFiles)
    }

    collectFiles(this.root)
    return files
  }

  /**
   * Gets the output structure
   */
  getStructure(): OutputDirectory {
    return this.root
  }

  /**
   * Flattens the directory structure to a list of file paths
   */
  getFilePaths(): string[] {
    return this.getAllFiles().map((f) => f.path)
  }

  /**
   * Groups files by directory
   */
  getFilesByDirectory(): Map<string, OutputFile[]> {
    const map = new Map<string, OutputFile[]>()

    const collectFiles = (dir: OutputDirectory) => {
      if (dir.files.length > 0) {
        map.set(dir.path, [...dir.files])
      }
      dir.subdirectories.forEach(collectFiles)
    }

    collectFiles(this.root)
    return map
  }
}

/**
 * Builder for creating organized output structures
 */
export class OutputBuilder {
  private organizer: OutputOrganizer
  private currentPath: string

  constructor(rootPath = '.') {
    this.organizer = new OutputOrganizer(rootPath)
    this.currentPath = rootPath
  }

  /**
   * Enters a directory (creates if doesn't exist)
   */
  directory(name: string, fn?: () => void): this {
    const previousPath = this.currentPath
    this.currentPath = path.join(this.currentPath, name)
    this.organizer.ensureDirectory(this.currentPath)

    if (fn) {
      fn()
      this.currentPath = previousPath
    }

    return this
  }

  /**
   * Exits current directory
   */
  up(): this {
    this.currentPath = path.dirname(this.currentPath)
    return this
  }

  /**
   * Adds a file in the current directory
   */
  file(baseName: string, content?: string, metadata?: Record<string, unknown>): this {
    const filePath = path.join(this.currentPath, baseName)
    this.organizer.addFile({
      baseName,
      path: filePath,
      content,
      metadata,
    })
    return this
  }

  /**
   * Adds multiple files in the current directory
   */
  files(files: Array<{ baseName: string; content?: string; metadata?: Record<string, unknown> }>): this {
    files.forEach((f) => this.file(f.baseName, f.content, f.metadata))
    return this
  }

  /**
   * Gets the organizer
   */
  build(): OutputOrganizer {
    return this.organizer
  }
}

/**
 * Creates an output builder
 */
export function createOutputBuilder(rootPath = '.'): OutputBuilder {
  return new OutputBuilder(rootPath)
}

/**
 * Creates an output organizer
 */
export function createOutputOrganizer(rootPath = '.'): OutputOrganizer {
  return new OutputOrganizer(rootPath)
}

/**
 * Helper to create a nested directory structure declaratively
 */
export function defineOutputStructure(rootPath: string, definition: (builder: OutputBuilder) => void): OutputOrganizer {
  const builder = createOutputBuilder(rootPath)
  definition(builder)
  return builder.build()
}
