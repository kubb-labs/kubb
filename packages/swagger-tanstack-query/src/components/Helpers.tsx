import path from 'node:path'
import url from 'node:url'

import { File } from '@kubb/react'

import type { ReactNode } from 'react'

export const templatesPath = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../templates')

const typesPath = path.resolve(templatesPath, './types.ts')

export function Helpers(): ReactNode {
  return (
    <>
      <File.Source path={typesPath} print removeComments></File.Source>
    </>
  )
}
