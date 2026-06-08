import type {
  KubbArrowFunctionProps,
  KubbConstProps,
  KubbExportProps,
  KubbFileProps,
  KubbFunctionProps,
  KubbImportProps,
  KubbJsxProps,
  KubbReactElement,
  KubbReactNode,
  KubbSourceProps,
  KubbTextProps,
  KubbTypeProps,
  Key,
  LineBreakProps,
} from './types'

/**
 * JSX contract for `@kubb/renderer-jsx`, resolved through `jsxImportSource`.
 *
 * It is self-contained and does not extend `React.JSX`: the renderer only emits
 * the custom `kubb-*` hosts plus `br`, `indent`, and `dedent`, and supports
 * pure function components, so the HTML element and class-component machinery
 * from `@types/react` is not needed.
 */
export namespace JSX {
  type ElementType = string | ((props: any) => KubbReactNode)
  type Element = KubbReactElement

  interface ElementClass {
    render(): KubbReactNode
  }
  interface ElementAttributesProperty {
    props: {}
  }
  interface ElementChildrenAttribute {
    children: {}
  }

  interface IntrinsicAttributes {
    key?: Key | null
  }
  interface IntrinsicClassAttributes<T> {
    key?: Key | null
  }

  interface IntrinsicElements {
    'kubb-jsx': KubbJsxProps
    'kubb-text': KubbTextProps
    'kubb-file': KubbFileProps
    'kubb-source': KubbSourceProps
    'kubb-import': KubbImportProps
    'kubb-export': KubbExportProps
    'kubb-function': KubbFunctionProps
    'kubb-arrow-function': KubbArrowFunctionProps
    'kubb-const': KubbConstProps
    'kubb-type': KubbTypeProps
    br: LineBreakProps
    indent: {}
    dedent: {}
  }

  type LibraryManagedAttributes<C, P> = P
}
