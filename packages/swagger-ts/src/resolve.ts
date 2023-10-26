import { resolve as swaggerResolve } from '@kubb/swagger'

import { pluginKey } from './plugin.ts'

import type { ResolveProps, Resolver } from '@kubb/swagger'

export function resolve(props: ResolveProps): Resolver {
  return swaggerResolve({ pluginKey, ...props })
}
