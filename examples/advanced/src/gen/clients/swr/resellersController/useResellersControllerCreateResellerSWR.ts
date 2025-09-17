import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  ResellersControllerCreateResellerMutationRequest,
  ResellersControllerCreateResellerMutationResponse,
} from '../../../models/ts/resellersController/ResellersControllerCreateReseller.ts'
import { resellersControllerCreateReseller } from '../../axios/ResellersService/resellersControllerCreateReseller.ts'

export const resellersControllerCreateResellerMutationKeySWR = () => [{ url: '/api/resellers' }] as const

export type ResellersControllerCreateResellerMutationKeySWR = ReturnType<typeof resellersControllerCreateResellerMutationKeySWR>

/**
 * {@link /api/resellers}
 */
export function useResellersControllerCreateResellerSWR(
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<ResellersControllerCreateResellerMutationResponse>,
        ResponseErrorConfig<Error>,
        ResellersControllerCreateResellerMutationKeySWR,
        ResellersControllerCreateResellerMutationRequest
      >
    >[2]
    client?: Partial<RequestConfig<ResellersControllerCreateResellerMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = resellersControllerCreateResellerMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<ResellersControllerCreateResellerMutationResponse>,
    ResponseErrorConfig<Error>,
    ResellersControllerCreateResellerMutationKeySWR | null,
    ResellersControllerCreateResellerMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return resellersControllerCreateReseller({ data }, config)
    },
    mutationOptions,
  )
}
