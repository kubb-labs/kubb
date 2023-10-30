import path from 'node:path'
import url from 'node:url'

import { File } from '@kubb/react'

import type { ReactNode } from 'react'

export const templatesPath = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../templates')

const typesPath = path.resolve(templatesPath, './types.ts')

type Props = {
  id?: string
  path: string
}

export function HelpersFile({ id, path: resolvedPath }: Props): ReactNode {
  return (
    <File id={id} override baseName={'types.ts'} path={resolvedPath}>
      <File.Source path={typesPath} print removeComments />
    </File>
  )
}
