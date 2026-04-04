import { useFabric } from '@kubb/react-fabric'

/**
 * @deprecated use `mode` from the generator component props instead
 */
export function useMode(): 'single' | 'split' {
  const { meta } = useFabric<{ mode: 'single' | 'split' }>()

  return meta.mode
}
