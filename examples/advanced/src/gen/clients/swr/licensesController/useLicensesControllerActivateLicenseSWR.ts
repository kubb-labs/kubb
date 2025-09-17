import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  LicensesControllerActivateLicenseMutationRequest,
  LicensesControllerActivateLicenseMutationResponse,
  LicensesControllerActivateLicensePathParams,
} from '../../../models/ts/licensesController/LicensesControllerActivateLicense.ts'
import { licensesControllerActivateLicense } from '../../axios/LicensesService/licensesControllerActivateLicense.ts'

export const licensesControllerActivateLicenseMutationKeySWR = () => [{ url: '/api/licenses/:id/activate' }] as const

export type LicensesControllerActivateLicenseMutationKeySWR = ReturnType<typeof licensesControllerActivateLicenseMutationKeySWR>

/**
 * {@link /api/licenses/:id/activate}
 */
export function useLicensesControllerActivateLicenseSWR(
  { id }: { id: LicensesControllerActivateLicensePathParams['id'] },
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<LicensesControllerActivateLicenseMutationResponse>,
        ResponseErrorConfig<Error>,
        LicensesControllerActivateLicenseMutationKeySWR,
        LicensesControllerActivateLicenseMutationRequest
      >
    >[2]
    client?: Partial<RequestConfig<LicensesControllerActivateLicenseMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = licensesControllerActivateLicenseMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<LicensesControllerActivateLicenseMutationResponse>,
    ResponseErrorConfig<Error>,
    LicensesControllerActivateLicenseMutationKeySWR | null,
    LicensesControllerActivateLicenseMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return licensesControllerActivateLicense({ id, data }, config)
    },
    mutationOptions,
  )
}
