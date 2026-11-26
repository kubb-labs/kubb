import { createRenamer, type Renamer } from '@internals/utils'
import { ast, type FileNode } from '@kubb/ast'
import { idOf, localName } from './definitions.ts'

/**
 * A renamer for one file, holding the names its imports and sources already bind, so a carried import or a local
 * declaration never takes one of them.
 *
 * @example
 * ```ts
 * const renamer = createFileRenamer(file)
 * renamer.assign({ name: 'Options', owner: idOf({ path: '/gen/models/Options.ts', name: 'Options' }) }) // 'Options2'
 * ```
 */
export function createFileRenamer(file: FileNode): Renamer {
  const renamer = createRenamer()
  for (const imp of file.imports) {
    for (const item of ast.file.getNames(imp)) renamer.bind({ name: localName(item), owner: idOf({ path: imp.path, name: item.name }) })
  }
  for (const source of file.sources) if (source.name) renamer.bind({ name: source.name, owner: file.path })
  return renamer
}
