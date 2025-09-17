import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  LicensesControllerCreateLicenseMutationRequest,
  LicensesControllerCreateLicenseMutationResponse,
} from '../../../models/ts/licensesController/LicensesControllerCreateLicense.ts'
import { licensesControllerCreateLicense } from '../../axios/LicensesService/licensesControllerCreateLicense.ts'

export const licensesControllerCreateLicenseMutationKeySWR = () => [{ url: '/api/licenses' }] as const

export type LicensesControllerCreateLicenseMutationKeySWR = ReturnType<typeof licensesControllerCreateLicenseMutationKeySWR>

/**
 * {@link /api/licenses}
 */
export function useLicensesControllerCreateLicenseSWR(
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<LicensesControllerCreateLicenseMutationResponse>,
        ResponseErrorConfig<Error>,
        LicensesControllerCreateLicenseMutationKeySWR,
        LicensesControllerCreateLicenseMutationRequest
      >
    >[2]
    client?: Partial<RequestConfig<LicensesControllerCreateLicenseMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = licensesControllerCreateLicenseMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<LicensesControllerCreateLicenseMutationResponse>,
    ResponseErrorConfig<Error>,
    LicensesControllerCreateLicenseMutationKeySWR | null,
    LicensesControllerCreateLicenseMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return licensesControllerCreateLicense({ data }, config)
    },
    mutationOptions,
  )
}
