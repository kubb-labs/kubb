import { useContext } from 'react'

import { File } from '../components/File.tsx'

import type { FileMetaBase } from '@kubb/core'
import type { FileContextProps } from '../components/File.tsx'

/**
 * `useFile` will return the current file when <File/> is used.
 */
export function useFile<TMeta extends FileMetaBase = FileMetaBase>(): FileContextProps<TMeta> {
  const file = useContext(File.Context)

  return file as FileContextProps<TMeta>
}
