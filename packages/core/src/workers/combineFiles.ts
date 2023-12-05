import { z } from 'zod'

import { fileSchema } from './schemas.ts'

import type { KubbFile } from '../FileManager.ts'

// TODO revert test cases
function combineFiles<TMeta extends KubbFile.FileMetaBase = KubbFile.FileMetaBase>(files: Array<KubbFile.File<TMeta> | null>): Array<KubbFile.File<TMeta>> {
  return files.filter(Boolean).reduce((acc, file: KubbFile.File<TMeta>) => {
    const prevIndex = acc.findIndex((item) => item.path === file.path)

    if (prevIndex === -1) {
      return [...acc, file]
    }

    const prev = acc[prevIndex]

    if (prev && file.override) {
      acc[prevIndex] = {
        imports: [],
        exports: [],
        ...file,
      }
      return acc
    }

    if (prev) {
      acc[prevIndex] = {
        ...file,
        source: prev.source && file.source ? `${prev.source}\n${file.source}` : '',
        imports: [...(prev.imports || []), ...(file.imports || [])],
        exports: [...(prev.exports || []), ...(file.exports || [])],
        env: { ...(prev.env || {}), ...(file.env || {}) },
      }
    }

    return acc
  }, [] as Array<KubbFile.File<TMeta>>)
}

export const optionsSchema = z.object({
  files: z.array(fileSchema),
})

export default (options: z.infer<typeof optionsSchema>): Array<KubbFile.File> => {
  try {
    const result = optionsSchema.parse(options)

    return combineFiles(result.files)
  } catch (e) {
    console.log(e)
    return []
  }
}
