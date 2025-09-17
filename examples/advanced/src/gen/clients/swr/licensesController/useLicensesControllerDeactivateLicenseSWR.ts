import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  LicensesControllerDeactivateLicenseMutationResponse,
  LicensesControllerDeactivateLicensePathParams,
} from '../../../models/ts/licensesController/LicensesControllerDeactivateLicense.ts'
import { licensesControllerDeactivateLicense } from '../../axios/LicensesService/licensesControllerDeactivateLicense.ts'

export const licensesControllerDeactivateLicenseMutationKeySWR = () => [{ url: '/api/licenses/:id/deactivate' }] as const

export type LicensesControllerDeactivateLicenseMutationKeySWR = ReturnType<typeof licensesControllerDeactivateLicenseMutationKeySWR>

/**
 * {@link /api/licenses/:id/deactivate}
 */
export function useLicensesControllerDeactivateLicenseSWR(
  { id }: { id: LicensesControllerDeactivateLicensePathParams['id'] },
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<LicensesControllerDeactivateLicenseMutationResponse>,
        ResponseErrorConfig<Error>,
        LicensesControllerDeactivateLicenseMutationKeySWR
      >
    >[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = licensesControllerDeactivateLicenseMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<LicensesControllerDeactivateLicenseMutationResponse>,
    ResponseErrorConfig<Error>,
    LicensesControllerDeactivateLicenseMutationKeySWR | null
  >(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return licensesControllerDeactivateLicense({ id }, config)
    },
    mutationOptions,
  )
}
