import ReactJSXRuntime from 'react/jsx-runtime'

import type * as KubbFile from '@kubb/fs/types'
import type { ReactNode } from 'react'
/**
 * TODO add for Server Components
 * import type {} from 'react/experimental'
 */

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

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
        env?: NodeJS.ProcessEnv
        override?: boolean
        exportable?: boolean
        meta?: KubbFile.File['meta']
      }

      'kubb-source': {
        children?: ReactNode
        path?: string
        print?: boolean
      }

      'kubb-import': KubbFile.Import & {
        print?: boolean
      }

      'kubb-export': KubbFile.Export & {
        print?: boolean
      }

      'kubb-parser': {
        language?: string
        children?: ReactNode
      }
      'kubb-parser-provider': {
        language?: string
        children?: ReactNode
      }
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
