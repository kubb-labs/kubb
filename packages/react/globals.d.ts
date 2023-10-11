import type { ReactNode, Key } from 'react'
import type { Export, Import } from '@kubb/core'

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

declare global {
	namespace JSX {
		// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
		interface IntrinsicElements {
			'kubb-text': Kubb.Components.Text
      'kubb-fun': Kubb.Components.Text
      'kubb-import': Kubb.Components.Import
      'kubb-export': Kubb.Components.Export
		}
	}
}

declare module Kubb {
  namespace Components {
    type Text = {
      children?: ReactNode;
      key?: Key;
      style?: Styles;
    };
    type Import = Import & {
      print?: boolean
    }

    type Export =  Export &{
      print?: boolean
    }
  }
 
}
