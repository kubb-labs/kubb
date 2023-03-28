import uniq from 'lodash.uniq'

import type { File } from './types'

export function combineFiles(files: Array<File | null>) {
  return files.filter(Boolean).reduce((acc, curr: File | null) => {
    if (!curr) {
      return acc
    }
    const prevIndex = acc.findIndex((item) => item.path === curr.path)

    if (prevIndex !== -1) {
      const prev = acc[prevIndex]
      acc[prevIndex] = {
        ...curr,
        source: `${prev.source}\n${curr.source}`,
        imports: [...(prev.imports || []), ...(curr.imports || [])],
      }
    } else {
      acc.push(curr)
    }

    return acc
  }, [] as File[])
}

export function getFileSource(file: File) {
  // TODO make generic check
  if (!file.fileName.endsWith('.ts')) {
    return file.source
  }
  const imports: File['imports'] = []

  file.imports?.forEach((curr) => {
    const exists = imports.find((imp) => imp.path === curr.path)
    if (!exists) {
      imports.push({
        ...curr,
        name: Array.isArray(curr.name) ? uniq(curr.name) : curr.name,
      })
    }

    if (exists && !Array.isArray(exists.name) && exists.name !== curr.name) {
      imports.push(curr)
    }

    if (exists && Array.isArray(exists.name)) {
      if (Array.isArray(curr.name)) {
        exists.name = uniq([...exists.name, ...curr.name])
      }
    }
  })

  const importSource = imports.reduce((prev, curr) => {
    if (Array.isArray(curr.name)) {
      return `${prev}\nimport ${curr.isTypeOnly ? 'type ' : ''}{ ${curr.name.join(', ')} } from "${curr.path}";`
    }

    return `${prev}\nimport ${curr.isTypeOnly ? 'type ' : ''}${curr.name} from "${curr.path}";`
  }, '')

  if (importSource) {
    return `${importSource}\n${file.source}`
  }

  return file.source
}
