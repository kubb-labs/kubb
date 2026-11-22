import type { KubbReactElement, KubbReactNode, Key } from './types'

import type { ast } from '@kubb/ast'

/**
 * JSX contract for `@kubb/renderer-jsx`, resolved through `jsxImportSource`.
 *
 * It is self-contained and does not extend `React.JSX`. The renderer only emits
 * the custom `kubb-*` hosts plus `br`, and supports pure function components, so
 * the HTML element and class-component machinery from `@types/react` is not needed.
 */
export namespace JSX {
  type ElementType = string | ((props: never) => KubbReactNode)
  type Element = KubbReactElement

  interface ElementChildrenAttribute {
    children: {}
  }

  interface IntrinsicAttributes {
    key?: Key | null
  }

  interface IntrinsicElements {
    ['kubb-jsx']: {
      children?: string
    }
    ['kubb-file']: Omit<ast.UserFileNode, 'sources' | 'imports' | 'exports' | 'meta' | 'pointer'> & {
      meta?: ast.FileNode['meta'] | null
      id?: string | null
      children?: KubbReactNode
    }
    ['kubb-origin']: Pick<ast.SourceNode, 'pointer'> & {
      children?: KubbReactNode
    }
    ['kubb-code']: Pick<ast.SourceNode, 'name' | 'export' | 'default' | 'space' | 'isTypeOnly' | 'inline'> & {
      children?: KubbReactNode
    }
    ['kubb-raw']: Pick<ast.SourceNode, 'name'> & {
      children?: KubbReactNode
    }
    ['kubb-import']: ast.ImportInput & {}
    ['kubb-export']: ast.ExportInput & {}
    ['kubb-function']: Omit<ast.FunctionNode, 'kind'> & {
      inline?: boolean
      children?: KubbReactNode
    }
    ['kubb-arrow-function']: Omit<ast.ArrowFunctionNode, 'kind'> & {
      inline?: boolean
      children?: KubbReactNode
    }
    ['kubb-const']: Omit<ast.ConstNode, 'kind'> & {
      inline?: boolean
      children?: KubbReactNode
    }
    ['kubb-type']: Omit<ast.TypeNode, 'kind'> & {
      inline?: boolean
      children?: KubbReactNode
    }
    br: {}
  }
}
