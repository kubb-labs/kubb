import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  LicensesControllerDeleteLicenseMutationResponse,
  LicensesControllerDeleteLicensePathParams,
} from '../../../models/ts/licensesController/LicensesControllerDeleteLicense.ts'
import { licensesControllerDeleteLicense } from '../../axios/LicensesService/licensesControllerDeleteLicense.ts'

export const licensesControllerDeleteLicenseMutationKeySWR = () => [{ url: '/api/licenses/:id' }] as const

export type LicensesControllerDeleteLicenseMutationKeySWR = ReturnType<typeof licensesControllerDeleteLicenseMutationKeySWR>

/**
 * {@link /api/licenses/:id}
 */
export function useLicensesControllerDeleteLicenseSWR(
  { id }: { id: LicensesControllerDeleteLicensePathParams['id'] },
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<LicensesControllerDeleteLicenseMutationResponse>,
        ResponseErrorConfig<Error>,
        LicensesControllerDeleteLicenseMutationKeySWR
      >
    >[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = licensesControllerDeleteLicenseMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<LicensesControllerDeleteLicenseMutationResponse>,
    ResponseErrorConfig<Error>,
    LicensesControllerDeleteLicenseMutationKeySWR | null
  >(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return licensesControllerDeleteLicense({ id }, config)
    },
    mutationOptions,
  )
}
