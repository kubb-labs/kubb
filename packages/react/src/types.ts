import type * as KubbFile from '@kubb/fs/types'
import type { ReactNode } from 'react'
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

export type ElementNames =
  | ReactElementNames
  | 'kubb-text'
  | 'kubb-file'
  | 'kubb-source'
  | 'kubb-import'
  | 'kubb-export'
  | 'kubb-root'
  | 'kubb-app'
  | 'kubb-language'
  | 'kubb-parser'

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

export type { Params, Param } from './shared/utils/getParams.ts'
