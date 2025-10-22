import '@kubb/react-fabric/globals'

import type { KubbFile } from '@kubb/core/fs'
import type { KubbNode } from './types.ts'

// biome-ignore lint/suspicious/noTsIgnore: not needed
// @ts-ignore
declare module '@kubb/react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'kubb-text': {
        children?: KubbNode
      }
      'kubb-file': {
        id?: string
        children?: KubbNode
        baseName: string
        path: string
        override?: boolean
        meta?: KubbFile.File['meta']
      }
      'kubb-source': KubbFile.Source & {
        children?: KubbNode
      }
      'kubb-import': KubbFile.Import
      'kubb-export': KubbFile.Export
      br: React.DetailedHTMLProps<React.HTMLAttributes<HTMLBRElement>, HTMLBRElement>
    }
  }
}
