import ReactJSXRuntime from 'react/jsx-runtime'

import type * as KubbFile from '@kubb/fs/types'
import type { ReactNode } from 'react'
import type { KubbNode } from './types.ts'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'kubb-text': {
        children?: ReactNode
      }
      'kubb-file': {
        id?: string
        children?: ReactNode
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
    }
  }
}

// @ts-ignore
export const Fragment = ReactJSXRuntime.Fragment
// @ts-ignore
export const jsx = ReactJSXRuntime.jsx
// @ts-ignore
export const jsxs = ReactJSXRuntime.jsxs
// @ts-ignore
export const jsxDEV = ReactJSXRuntime.jsx
