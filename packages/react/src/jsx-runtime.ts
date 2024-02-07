/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import ReactJSXRuntime from 'react/jsx-runtime'

import type { KubbFile } from '@kubb/core'
import type { Key, ReactNode } from 'react'
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
        key?: Key
      }

      'kubb-file': {
        id?: string
        children?: ReactNode
        key?: Key
        baseName: string
        path: string
        env?: NodeJS.ProcessEnv
        override?: boolean
        meta?: KubbFile.File['meta']
      }

      'kubb-source': {
        children?: ReactNode
        key?: Key
        path?: string
        print?: boolean
      }

      'kubb-import': KubbFile.Import & {
        print?: boolean
      }

      'kubb-export': KubbFile.Export & {
        print?: boolean
      }

      'kubb-editor': {
        language?: string
        key?: Key
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
