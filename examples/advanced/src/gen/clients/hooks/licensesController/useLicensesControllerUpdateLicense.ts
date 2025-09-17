import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  LicensesControllerUpdateLicenseMutationRequest,
  LicensesControllerUpdateLicenseMutationResponse,
  LicensesControllerUpdateLicensePathParams,
} from '../../../models/ts/licensesController/LicensesControllerUpdateLicense.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { licensesControllerUpdateLicense } from '../../axios/LicensesService/licensesControllerUpdateLicense.ts'
import { useMutation } from '@tanstack/react-query'

export const licensesControllerUpdateLicenseMutationKey = () => [{ url: '/api/licenses/:id' }] as const

export type LicensesControllerUpdateLicenseMutationKey = ReturnType<typeof licensesControllerUpdateLicenseMutationKey>

/**
 * {@link /api/licenses/:id}
 */
export function useLicensesControllerUpdateLicense<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<LicensesControllerUpdateLicenseMutationResponse>,
      ResponseErrorConfig<Error>,
      { id: LicensesControllerUpdateLicensePathParams['id']; data: LicensesControllerUpdateLicenseMutationRequest },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<LicensesControllerUpdateLicenseMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? licensesControllerUpdateLicenseMutationKey()

  return useMutation<
    ResponseConfig<LicensesControllerUpdateLicenseMutationResponse>,
    ResponseErrorConfig<Error>,
    { id: LicensesControllerUpdateLicensePathParams['id']; data: LicensesControllerUpdateLicenseMutationRequest },
    TContext
  >(
    {
      mutationFn: async ({ id, data }) => {
        return licensesControllerUpdateLicense({ id, data }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}
