import type React from 'react'
import type {
  KubbExportProps,
  KubbFileProps,
  KubbImportProps,
  KubbJsxProps,
  KubbReactElement,
  KubbReactNode,
  KubbSourceProps,
  KubbTextProps,
  LineBreakProps,
} from './types.ts'

declare global {
  namespace JSX {
    type Element = KubbReactElement

    interface ElementClass extends React.ComponentClass<any> {
      render(): KubbReactNode
    }

    interface IntrinsicElements {
      'kubb-jsx': KubbJsxProps
      'kubb-text': KubbTextProps
      'kubb-file': KubbFileProps
      'kubb-source': KubbSourceProps
      'kubb-import': KubbImportProps
      'kubb-export': KubbExportProps
      br: LineBreakProps
      indent: {}
      dedent: {}
    }
  }
}
