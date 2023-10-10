import { resolve as swaggerResolve } from '@kubb/swagger'

import { pluginName } from '../plugin.ts'

import type { ResolveProps, Resolver } from '@kubb/swagger'

type Props = ResolveProps & { pluginName?: never }

export function resolve(props: Props): Resolver {
  return swaggerResolve({ ...props, pluginName })
}
