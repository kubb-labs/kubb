import path from 'node:path'
import url from 'node:url'

import { File } from '@kubb/react'

import type { ReactNode } from 'react'

export const templatesPath = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../templates')

const typesPath = path.resolve(templatesPath, './types.ts')

type Props = {
  path: string
}

export function HelpersFile({ path: resolvedPath }: Props): ReactNode {
  // TODO using override for now to be sure we are not appending after every render(with the operationGenerator)
  return (
    <File override baseName={'types.ts'} path={path.resolve(resolvedPath, '../types.ts')}>
      <File.Source path={typesPath} print removeComments />
    </File>
  )
}
