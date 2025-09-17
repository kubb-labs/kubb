import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  WeldPacksControllerDeactivateLicenseMutationResponse,
  WeldPacksControllerDeactivateLicensePathParams,
} from '../../../models/ts/weldPacksController/WeldPacksControllerDeactivateLicense.ts'
import { weldPacksControllerDeactivateLicense } from '../../axios/WeldPacksService/weldPacksControllerDeactivateLicense.ts'

export const weldPacksControllerDeactivateLicenseMutationKeySWR = () => [{ url: '/api/weldpacks/:id/deactivate' }] as const

export type WeldPacksControllerDeactivateLicenseMutationKeySWR = ReturnType<typeof weldPacksControllerDeactivateLicenseMutationKeySWR>

/**
 * {@link /api/weldpacks/:id/deactivate}
 */
export function useWeldPacksControllerDeactivateLicenseSWR(
  { id }: { id: WeldPacksControllerDeactivateLicensePathParams['id'] },
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<WeldPacksControllerDeactivateLicenseMutationResponse>,
        ResponseErrorConfig<Error>,
        WeldPacksControllerDeactivateLicenseMutationKeySWR
      >
    >[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = weldPacksControllerDeactivateLicenseMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<WeldPacksControllerDeactivateLicenseMutationResponse>,
    ResponseErrorConfig<Error>,
    WeldPacksControllerDeactivateLicenseMutationKeySWR | null
  >(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return weldPacksControllerDeactivateLicense({ id }, config)
    },
    mutationOptions,
  )
}
