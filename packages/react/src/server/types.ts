import type { KubbFile } from '@kubb/core'
import type { ReactNode } from 'react'

export type RootType<T = unknown> = {
  renderToString(children: ReactNode, context?: T): Promise<string>
  unmount(): void
  /**
   * @deprecated
   * Use Files instead
   * File will include all sources combined
   */
  file?: KubbFile.File
  files: KubbFile.File[]
  getFile: (id: string) => KubbFile.File | undefined
}
