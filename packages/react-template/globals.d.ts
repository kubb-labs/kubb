import {type ReactNode, type Key, type LegacyRef} from 'react';

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

declare global {
	namespace JSX {
		// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
		interface IntrinsicElements {
			'kubb-text': Kubb.Components.Text
      'kubb-fun': Kubb.Components.Text
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
  }
 
}
