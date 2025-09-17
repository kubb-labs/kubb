import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  LicensesControllerCreateLicenseMutationRequest,
  LicensesControllerCreateLicenseMutationResponse,
} from '../../../models/ts/licensesController/LicensesControllerCreateLicense.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { licensesControllerCreateLicense } from '../../axios/LicensesService/licensesControllerCreateLicense.ts'
import { useMutation } from '@tanstack/react-query'

export const licensesControllerCreateLicenseMutationKey = () => [{ url: '/api/licenses' }] as const

export type LicensesControllerCreateLicenseMutationKey = ReturnType<typeof licensesControllerCreateLicenseMutationKey>

/**
 * {@link /api/licenses}
 */
export function useLicensesControllerCreateLicense<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<LicensesControllerCreateLicenseMutationResponse>,
      ResponseErrorConfig<Error>,
      { data: LicensesControllerCreateLicenseMutationRequest },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<LicensesControllerCreateLicenseMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? licensesControllerCreateLicenseMutationKey()

  return useMutation<
    ResponseConfig<LicensesControllerCreateLicenseMutationResponse>,
    ResponseErrorConfig<Error>,
    { data: LicensesControllerCreateLicenseMutationRequest },
    TContext
  >(
    {
      mutationFn: async ({ data }) => {
        return licensesControllerCreateLicense({ data }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}
