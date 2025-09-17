import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  ResellersControllerUpdateResellerMutationRequest,
  ResellersControllerUpdateResellerMutationResponse,
  ResellersControllerUpdateResellerPathParams,
} from '../../../models/ts/resellersController/ResellersControllerUpdateReseller.ts'
import { resellersControllerUpdateReseller } from '../../axios/ResellersService/resellersControllerUpdateReseller.ts'

export const resellersControllerUpdateResellerMutationKeySWR = () => [{ url: '/api/resellers/:id' }] as const

export type ResellersControllerUpdateResellerMutationKeySWR = ReturnType<typeof resellersControllerUpdateResellerMutationKeySWR>

/**
 * {@link /api/resellers/:id}
 */
export function useResellersControllerUpdateResellerSWR(
  { id }: { id: ResellersControllerUpdateResellerPathParams['id'] },
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<ResellersControllerUpdateResellerMutationResponse>,
        ResponseErrorConfig<Error>,
        ResellersControllerUpdateResellerMutationKeySWR,
        ResellersControllerUpdateResellerMutationRequest
      >
    >[2]
    client?: Partial<RequestConfig<ResellersControllerUpdateResellerMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = resellersControllerUpdateResellerMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<ResellersControllerUpdateResellerMutationResponse>,
    ResponseErrorConfig<Error>,
    ResellersControllerUpdateResellerMutationKeySWR | null,
    ResellersControllerUpdateResellerMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return resellersControllerUpdateReseller({ id, data }, config)
    },
    mutationOptions,
  )
}
