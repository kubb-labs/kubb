import type { FileNode } from '@kubb/ast'
import { defineResolver, toFilePath } from '@kubb/core'

/** A `file.baseName` rule that nests dotted names and cases the file name with `caseLast`. */
export function resolverCasedFile(caseLast: (part: string) => string) {
  return defineResolver({
    file: {
      baseName({ name, extname }: { name: string; extname: FileNode['extname'] }): FileNode['baseName'] {
        return this.memo(`file:${name}\0${extname}`, (): FileNode['baseName'] => `${toFilePath(name, caseLast)}${extname}`)
      },
    },
  })
}
