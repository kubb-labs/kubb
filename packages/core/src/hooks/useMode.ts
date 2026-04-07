import { inject, KubbContext } from '@kubb/renderer-jsx'

/**
 * @deprecated use `mode` from the generator component props instead
 */
export function useMode(): 'single' | 'split' {
  return inject(KubbContext)!.mode
}
