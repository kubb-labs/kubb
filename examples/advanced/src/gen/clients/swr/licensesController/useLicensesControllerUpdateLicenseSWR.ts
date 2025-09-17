import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  LicensesControllerUpdateLicenseMutationRequest,
  LicensesControllerUpdateLicenseMutationResponse,
  LicensesControllerUpdateLicensePathParams,
} from '../../../models/ts/licensesController/LicensesControllerUpdateLicense.ts'
import { licensesControllerUpdateLicense } from '../../axios/LicensesService/licensesControllerUpdateLicense.ts'

export const licensesControllerUpdateLicenseMutationKeySWR = () => [{ url: '/api/licenses/:id' }] as const

export type LicensesControllerUpdateLicenseMutationKeySWR = ReturnType<typeof licensesControllerUpdateLicenseMutationKeySWR>

/**
 * {@link /api/licenses/:id}
 */
export function useLicensesControllerUpdateLicenseSWR(
  { id }: { id: LicensesControllerUpdateLicensePathParams['id'] },
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<LicensesControllerUpdateLicenseMutationResponse>,
        ResponseErrorConfig<Error>,
        LicensesControllerUpdateLicenseMutationKeySWR,
        LicensesControllerUpdateLicenseMutationRequest
      >
    >[2]
    client?: Partial<RequestConfig<LicensesControllerUpdateLicenseMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = licensesControllerUpdateLicenseMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<LicensesControllerUpdateLicenseMutationResponse>,
    ResponseErrorConfig<Error>,
    LicensesControllerUpdateLicenseMutationKeySWR | null,
    LicensesControllerUpdateLicenseMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return licensesControllerUpdateLicense({ id, data }, config)
    },
    mutationOptions,
  )
}
