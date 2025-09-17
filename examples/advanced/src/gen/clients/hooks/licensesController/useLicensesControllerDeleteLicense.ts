import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  LicensesControllerDeleteLicenseMutationResponse,
  LicensesControllerDeleteLicensePathParams,
} from '../../../models/ts/licensesController/LicensesControllerDeleteLicense.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { licensesControllerDeleteLicense } from '../../axios/LicensesService/licensesControllerDeleteLicense.ts'
import { useMutation } from '@tanstack/react-query'

export const licensesControllerDeleteLicenseMutationKey = () => [{ url: '/api/licenses/:id' }] as const

export type LicensesControllerDeleteLicenseMutationKey = ReturnType<typeof licensesControllerDeleteLicenseMutationKey>

/**
 * {@link /api/licenses/:id}
 */
export function useLicensesControllerDeleteLicense<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<LicensesControllerDeleteLicenseMutationResponse>,
      ResponseErrorConfig<Error>,
      { id: LicensesControllerDeleteLicensePathParams['id'] },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? licensesControllerDeleteLicenseMutationKey()

  return useMutation<
    ResponseConfig<LicensesControllerDeleteLicenseMutationResponse>,
    ResponseErrorConfig<Error>,
    { id: LicensesControllerDeleteLicensePathParams['id'] },
    TContext
  >(
    {
      mutationFn: async ({ id }) => {
        return licensesControllerDeleteLicense({ id }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}
