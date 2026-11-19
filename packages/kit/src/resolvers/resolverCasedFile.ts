import type { FileNode } from '@kubb/ast'
import { defineResolver, toFilePath } from '@kubb/core'

/**
 * Builds a `file` rule that turns a dotted name into a nested path and cases the file name with
 * `caseLast`. Folders stay camelCase.
 *
 * @example PascalCase file names
 * ```ts
 * createResolver<PluginTs>({ pluginName: 'plugin-ts', ...resolverCasedFile(casing.pascal) })
 * // 'pet.petId' → 'pet/PetId.ts'
 * ```
 */
export function resolverCasedFile(caseLast: (part: string) => string) {
  return defineResolver({
    file: {
      baseName({ name, extname }: { name: string; extname: FileNode['extname'] }): FileNode['baseName'] {
        return this.memo(`file:${name}\0${extname}`, (): FileNode['baseName'] => `${toFilePath(name, caseLast)}${extname}`)
      },
    },
  })
}
