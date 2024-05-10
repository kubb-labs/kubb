import type * as KubbFile from '@kubb/fs/types'
import type { ReactNode } from 'react'

export type RootType<T = unknown> = {
  render(children: ReactNode, context?: T): void
  unmount(): void
  output: string
  files: KubbFile.File[]
  getFile: (id: string) => KubbFile.File | undefined
}
