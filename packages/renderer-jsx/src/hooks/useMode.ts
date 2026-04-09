import { inject } from '@internals/utils'
import { KubbContext } from '../context/KubbContext.ts'

/**
 * @deprecated use `mode` from the generator component props instead
 */
export function useMode(): 'single' | 'split' {
  return inject(KubbContext)!.mode
}
