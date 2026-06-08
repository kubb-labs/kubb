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
} from './types.ts'

declare global {
  namespace JSX {
    type Element = KubbReactElement

    interface ElementClass {
      render(): KubbReactNode
    }

    interface IntrinsicAttributes {
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
  }
}
