import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  WeldPacksControllerDeactivateLicenseMutationResponse,
  WeldPacksControllerDeactivateLicensePathParams,
} from '../../../models/ts/weldPacksController/WeldPacksControllerDeactivateLicense.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { weldPacksControllerDeactivateLicense } from '../../axios/WeldPacksService/weldPacksControllerDeactivateLicense.ts'
import { useMutation } from '@tanstack/react-query'

export const weldPacksControllerDeactivateLicenseMutationKey = () => [{ url: '/api/weldpacks/:id/deactivate' }] as const

export type WeldPacksControllerDeactivateLicenseMutationKey = ReturnType<typeof weldPacksControllerDeactivateLicenseMutationKey>

/**
 * {@link /api/weldpacks/:id/deactivate}
 */
export function useWeldPacksControllerDeactivateLicense<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<WeldPacksControllerDeactivateLicenseMutationResponse>,
      ResponseErrorConfig<Error>,
      { id: WeldPacksControllerDeactivateLicensePathParams['id'] },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? weldPacksControllerDeactivateLicenseMutationKey()

  return useMutation<
    ResponseConfig<WeldPacksControllerDeactivateLicenseMutationResponse>,
    ResponseErrorConfig<Error>,
    { id: WeldPacksControllerDeactivateLicensePathParams['id'] },
    TContext
  >(
    {
      mutationFn: async ({ id }) => {
        return weldPacksControllerDeactivateLicense({ id }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}
