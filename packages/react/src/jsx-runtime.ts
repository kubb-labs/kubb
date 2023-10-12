/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import ReactJSXRuntime from 'react/jsx-runtime'

import type { Export, Import } from '@kubb/core'
import type { Key, ReactNode } from 'react'

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
        children?: ReactNode
        key?: Key
        fileName: string
        path: string
        env?: NodeJS.ProcessEnv
      }

      'kubb-import': Import & {
        print?: boolean
      }
      'kubb-export': Export & {
        print?: boolean
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
