import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  LicensesControllerActivateLicenseMutationRequest,
  LicensesControllerActivateLicenseMutationResponse,
  LicensesControllerActivateLicensePathParams,
} from '../../../models/ts/licensesController/LicensesControllerActivateLicense.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { licensesControllerActivateLicense } from '../../axios/LicensesService/licensesControllerActivateLicense.ts'
import { useMutation } from '@tanstack/react-query'

export const licensesControllerActivateLicenseMutationKey = () => [{ url: '/api/licenses/:id/activate' }] as const

export type LicensesControllerActivateLicenseMutationKey = ReturnType<typeof licensesControllerActivateLicenseMutationKey>

/**
 * {@link /api/licenses/:id/activate}
 */
export function useLicensesControllerActivateLicense<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<LicensesControllerActivateLicenseMutationResponse>,
      ResponseErrorConfig<Error>,
      { id: LicensesControllerActivateLicensePathParams['id']; data: LicensesControllerActivateLicenseMutationRequest },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<LicensesControllerActivateLicenseMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? licensesControllerActivateLicenseMutationKey()

  return useMutation<
    ResponseConfig<LicensesControllerActivateLicenseMutationResponse>,
    ResponseErrorConfig<Error>,
    { id: LicensesControllerActivateLicensePathParams['id']; data: LicensesControllerActivateLicenseMutationRequest },
    TContext
  >(
    {
      mutationFn: async ({ id, data }) => {
        return licensesControllerActivateLicense({ id, data }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}
