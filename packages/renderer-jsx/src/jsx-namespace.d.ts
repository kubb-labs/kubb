import type React from 'react'

import type {
  KubbConstProps,
  KubbExportProps,
  KubbFileProps,
  KubbFunctionProps,
  KubbImportProps,
  KubbReactElement,
  KubbReactNode,
  KubbSourceProps,
  KubbTextProps,
  KubbTypeProps,
  LineBreakProps,
} from './types'

export namespace JSX {
  type ElementType = React.JSX.ElementType
  type Element = KubbReactElement

  interface ElementClass extends React.JSX.ElementClass {
    render(): KubbReactNode
  }
  interface ElementAttributesProperty {
    props: {}
  }

  interface ElementChildrenAttribute {
    children: {}
  }

  interface IntrinsicElements extends React.JSX.IntrinsicElements {
    'kubb-text': KubbTextProps
    'kubb-file': KubbFileProps
    'kubb-source': KubbSourceProps
    'kubb-import': KubbImportProps
    'kubb-export': KubbExportProps
    'kubb-function': KubbFunctionProps
    'kubb-const': KubbConstProps
    'kubb-type': KubbTypeProps
    br: LineBreakProps
    indent: {}
    dedent: {}
  }
  type LibraryManagedAttributes<C, P> = React.JSX.LibraryManagedAttributes<C, P>
  interface IntrinsicClassAttributes<T> extends React.JSX.IntrinsicClassAttributes<T> {}
  interface IntrinsicElements extends React.JSX.IntrinsicElements {}
}
