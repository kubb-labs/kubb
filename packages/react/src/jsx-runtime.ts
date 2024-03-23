/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import ReactJSXRuntime from 'react/jsx-runtime'

import type { KubbFile } from '@kubb/core'
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

      'kubb-editor': {
        language?: string
        children?: ReactNode
      }
      'kubb-editor-provider': {
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
