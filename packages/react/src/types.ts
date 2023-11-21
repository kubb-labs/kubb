/* eslint-disable @typescript-eslint/no-namespace */
import type { KubbFile } from '@kubb/core'
import type { Key, ReactNode } from 'react'
/**
 * TODO add for Server Components
 * import type {} from 'react/experimental'
 */

type ReactElementNames = 'br'

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
        removeComments?: boolean
        noEmitHelpers?: boolean
      }

      'kubb-import': KubbFile.Import & {
        print?: boolean
      }
      'kubb-export': KubbFile.Export & {
        print?: boolean
      }
    }
  }
}

export type ElementNames = ReactElementNames | 'kubb-text' | 'kubb-file' | 'kubb-source' | 'kubb-import' | 'kubb-export' | 'kubb-root' | 'kubb-app'

export type Node = {
  parentNode: DOMElement | undefined
  internal_static?: boolean
}

export type DOMNodeAttribute = boolean | string | number

type TextName = '#text'
export type TextNode = {
  nodeName: TextName
  nodeValue: string
} & Node

// dprint-ignore
export type DOMNode<T = { nodeName: NodeNames }> = T extends {
  nodeName: infer U
}
  ? U extends '#text'
    ? TextNode
    : DOMElement
  : never

type OutputTransformer = (s: string, index: number) => string

export type DOMElement = {
  nodeName: ElementNames
  attributes: Record<string, DOMNodeAttribute>
  childNodes: DOMNode[]
  internal_transform?: OutputTransformer

  // Internal properties
  isStaticDirty?: boolean
  staticNode?: DOMElement
  onComputeLayout?: () => void
  onRender?: () => void
  onImmediateRender?: () => void
} & Node

export type NodeNames = ElementNames | TextName

export type KubbNode = ReactNode

export type JSDoc = {
  comments: string[]
}
