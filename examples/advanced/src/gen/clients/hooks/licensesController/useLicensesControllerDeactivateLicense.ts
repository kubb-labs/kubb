import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  LicensesControllerDeactivateLicenseMutationResponse,
  LicensesControllerDeactivateLicensePathParams,
} from '../../../models/ts/licensesController/LicensesControllerDeactivateLicense.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { licensesControllerDeactivateLicense } from '../../axios/LicensesService/licensesControllerDeactivateLicense.ts'
import { useMutation } from '@tanstack/react-query'

export const licensesControllerDeactivateLicenseMutationKey = () => [{ url: '/api/licenses/:id/deactivate' }] as const

export type LicensesControllerDeactivateLicenseMutationKey = ReturnType<typeof licensesControllerDeactivateLicenseMutationKey>

/**
 * {@link /api/licenses/:id/deactivate}
 */
export function useLicensesControllerDeactivateLicense<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<LicensesControllerDeactivateLicenseMutationResponse>,
      ResponseErrorConfig<Error>,
      { id: LicensesControllerDeactivateLicensePathParams['id'] },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? licensesControllerDeactivateLicenseMutationKey()

  return useMutation<
    ResponseConfig<LicensesControllerDeactivateLicenseMutationResponse>,
    ResponseErrorConfig<Error>,
    { id: LicensesControllerDeactivateLicensePathParams['id'] },
    TContext
  >(
    {
      mutationFn: async ({ id }) => {
        return licensesControllerDeactivateLicense({ id }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}
