import { uniqueName } from '@internals/utils'
import { ast, type FileNode } from '@kubb/ast'
import { idOf, localName } from './definitions.ts'

/**
 * Which binding owns each name in one file, so a carried import or a local declaration never takes a name in use.
 *
 * @example
 * ```ts
 * const renamer = createRenamer(file)
 * renamer.reserve('Response') // a global the file uses
 * renamer.assign(id, 'Response') // 'Response2'
 * ```
 */
export class Renamer {
  // `''` marks a reserved name, such as a global.
  readonly #owners = new Map<string, string>()

  constructor(file: FileNode) {
    for (const imp of file.imports) for (const item of ast.file.getNames(imp)) this.#owners.set(localName(item), idOf(imp.path, item.name))
    for (const source of file.sources) if (source.name) this.#owners.set(source.name, file.path)
  }

  reserve(name: string): void {
    if (!this.#owners.has(name)) this.#owners.set(name, '')
  }

  /**
   * Gives `id` the name `name`, adding a number when another binding owns it, and returns the name it got.
   */
  assign(id: string, name: string): string {
    const local = uniqueName(name, (candidate) => this.#owners.has(candidate) && this.#owners.get(candidate) !== id)
    this.#owners.set(local, id)
    return local
  }
}

/**
 * Creates the renamer for one file, seeded with the names its imports and sources bind.
 */
export function createRenamer(file: FileNode): Renamer {
  return new Renamer(file)
}
