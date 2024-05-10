import type * as KubbFile from '@kubb/fs/types'
import type { ReactNode } from 'react'

export type RootType<T = unknown> = {
  renderToString(children: ReactNode, context?: T): Promise<string>
  unmount(): void
  files: KubbFile.File[]
  getFile: (id: string) => KubbFile.File | undefined
}
